from __future__ import annotations

from datetime import datetime

from flask import flash, redirect, request, url_for
from flask_admin import Admin, AdminIndexView
from flask_admin.contrib.sqla import ModelView
from flask_admin.form import SecureForm
from flask_login import current_user
from sqlalchemy import select
from wtforms import FileField, SelectField
from wtforms.validators import DataRequired, InputRequired, Length, NumberRange, Optional

from database import db
from models import CarouselSlide, Committee, Member, News
from security import sanitize_news_html
from ticker_model import TickerItem, TickerSettings
from validators import validate_http_url
from uploads import (
    ALLOWED_LOGO_EXTENSIONS,
    ALLOWED_MEDIA_EXTENSIONS,
    UploadValidationError,
    delete_upload,
    save_upload,
)


def _stored_value(model, column_name: str) -> str:
    model_id = getattr(model, "id", None)
    if not model_id:
        return ""
    column = getattr(type(model), column_name)
    return db.session.execute(select(column).where(type(model).id == model_id)).scalar_one_or_none() or ""


def _upload_is_referenced(filename: str) -> bool:
    """Не удалять файл, если на него всё ещё ссылается другая запись."""
    if not filename:
        return False
    checks = (
        db.session.execute(select(CarouselSlide.id).where(CarouselSlide.media_file == filename).limit(1)).first(),
        db.session.execute(select(Member.id).where(Member.logo == filename).limit(1)).first(),
        db.session.execute(select(News.id).where(News.media_file == filename).limit(1)).first(),
    )
    return any(checks)


class SecureAdminIndexView(AdminIndexView):
    def is_accessible(self):
        return bool(getattr(current_user, "is_authenticated", False))

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for("auth.login", next=request.full_path))


class SecureModelView(ModelView):
    form_base_class = SecureForm
    can_view_details = True
    page_size = 50
    column_labels = {
        "position": "Порядок",
        "created_at": "Дата создания",
    }
    form_args = {
        "position": {"validators": [InputRequired(), NumberRange(min=0, max=10000)]},
    }

    def is_accessible(self):
        return bool(getattr(current_user, "is_authenticated", False))

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for("auth.login", next=request.full_path))

    def handle_view_exception(self, exc):
        if isinstance(exc, UploadValidationError):
            flash(str(exc), "error")
            return True
        return super().handle_view_exception(exc)


class UploadCleanupMixin:
    upload_column = ""

    def _replace_upload(self, form, model, allowed_exts: set[str], media_type_column: str | None = None):
        old_name = _stored_value(model, self.upload_column)
        uploaded = save_upload(getattr(form, self.upload_column).data, allowed_exts)
        if uploaded:
            new_name, detected_type = uploaded
            setattr(model, self.upload_column, new_name)
            if media_type_column:
                setattr(model, media_type_column, detected_type)
            model._old_upload_name = old_name if old_name != new_name else ""
        elif old_name:
            setattr(model, self.upload_column, old_name)

    def after_model_change(self, form, model, is_created):
        old_name = getattr(model, "_old_upload_name", "")
        if old_name and not _upload_is_referenced(old_name):
            delete_upload(old_name)

    def after_model_delete(self, model):
        filename = getattr(model, self.upload_column, "")
        if filename and not _upload_is_referenced(filename):
            delete_upload(filename)


class CarouselAdmin(UploadCleanupMixin, SecureModelView):
    upload_column = "media_file"
    column_default_sort = ("position", False)
    column_list = ("position", "media_file", "media_type", "created_at")
    form_overrides = {"media_file": FileField}
    form_excluded_columns = ("media_type",)
    form_args = {
        "position": {"validators": [InputRequired(), NumberRange(min=0, max=10000)]},
    }

    def on_model_change(self, form, model, is_created):
        self._replace_upload(form, model, ALLOWED_MEDIA_EXTENSIONS, "media_type")
        if is_created and not getattr(model, "media_file", ""):
            raise UploadValidationError("Для нового слайда необходимо выбрать файл")
        if not getattr(model, "created_at", None):
            model.created_at = datetime.utcnow()


class CommitteeAdmin(SecureModelView):
    column_default_sort = ("position", False)
    column_list = ("position", "title", "tag", "created_at")
    form_args = {
        "position": {"validators": [InputRequired(), NumberRange(min=0, max=10000)]},
        "title": {"validators": [DataRequired(), Length(max=255)]},
        "bullets": {"validators": [Optional(), Length(max=5000)]},
        "tag": {"validators": [Optional(), Length(max=80)]},
    }


class MemberAdmin(UploadCleanupMixin, SecureModelView):
    upload_column = "logo"
    column_default_sort = ("position", False)
    column_list = ("position", "name", "url", "logo", "created_at")
    form_overrides = {"logo": FileField}
    form_args = {
        "position": {"validators": [InputRequired(), NumberRange(min=0, max=10000)]},
        "name": {"validators": [DataRequired(), Length(max=255)]},
        "description": {"validators": [Optional(), Length(max=3000)]},
        "url": {"validators": [Optional(), Length(max=255), validate_http_url]},
    }

    def on_model_change(self, form, model, is_created):
        self._replace_upload(form, model, ALLOWED_LOGO_EXTENSIONS)
        if not getattr(model, "created_at", None):
            model.created_at = datetime.utcnow()


class NewsAdmin(UploadCleanupMixin, SecureModelView):
    upload_column = "media_file"
    column_default_sort = ("created_at", True)
    column_list = ("created_at", "title", "media_type", "size", "is_published")
    form_overrides = {
        "media_file": FileField,
        "size": SelectField,
    }
    form_args = {
        "title": {"validators": [DataRequired(), Length(max=255)]},
        "content_html": {"validators": [Optional(), Length(max=30000)]},
        "size": {
            "choices": [("small", "Обычная"), ("big", "Крупная")],
            "validators": [DataRequired()],
        },
    }
    form_excluded_columns = ("media_type",)

    def on_model_change(self, form, model, is_created):
        self._replace_upload(form, model, ALLOWED_MEDIA_EXTENSIONS, "media_type")
        model.content_html = sanitize_news_html(model.content_html)
        if not getattr(model, "created_at", None):
            model.created_at = datetime.utcnow()


class TickerSettingsAdmin(SecureModelView):
    can_create = False
    can_delete = False
    can_edit = True
    can_view_details = False
    column_list = ("is_enabled", "speed_seconds")
    column_labels = {
        "is_enabled": "Включено",
        "speed_seconds": "Секунд на одну новость",
    }
    form_columns = ("is_enabled", "speed_seconds")
    form_args = {"speed_seconds": {"validators": [InputRequired(), NumberRange(min=2, max=120)]}}


class TickerItemAdmin(SecureModelView):
    column_default_sort = ("position", False)
    column_list = ("position", "text", "is_enabled")
    column_labels = {
        "position": "Порядок",
        "text": "Текст новости",
        "is_enabled": "Показывать",
    }
    form_columns = ("position", "text", "is_enabled")
    form_args = {
        "position": {"validators": [InputRequired(), NumberRange(min=0, max=10000)]},
        "text": {"validators": [DataRequired(), Length(max=500)]},
    }


def setup_admin(app):
    admin = Admin(
        app,
        name="ITAS Admin",
        index_view=SecureAdminIndexView(url="/admin/", endpoint="admin"),
        url="/admin/",
    )
    admin.add_view(CarouselAdmin(CarouselSlide, db.session, name="Карусель", endpoint="carousel", url="/admin/carousel/"))
    admin.add_view(CommitteeAdmin(Committee, db.session, name="Комитеты", endpoint="committee", url="/admin/committee/"))
    admin.add_view(MemberAdmin(Member, db.session, name="Участники", endpoint="member", url="/admin/member/"))
    admin.add_view(NewsAdmin(News, db.session, name="Новости", endpoint="news", url="/admin/news/"))
    admin.add_view(TickerSettingsAdmin(TickerSettings, db.session, name="Тикер: настройки", endpoint="ticker_settings", url="/admin/ticker-settings/"))
    admin.add_view(TickerItemAdmin(TickerItem, db.session, name="Тикер: новости", endpoint="ticker", url="/admin/ticker/"))
    return admin
