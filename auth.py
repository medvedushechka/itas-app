from __future__ import annotations

import hmac
import os

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import LoginManager, UserMixin, current_user, login_user, logout_user
from werkzeug.security import check_password_hash

from security import is_safe_local_redirect


auth_bp = Blueprint("auth", __name__)
login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.login_message = "Войдите, чтобы открыть административную панель."
login_manager.login_message_category = "warning"


class AdminUser(UserMixin):
    def __init__(self, user_id: str):
        self.id = user_id


@login_manager.user_loader
def load_user(user_id: str):
    return AdminUser("admin") if user_id == "admin" else None


def _get_credentials() -> tuple[str, str]:
    return (
        os.getenv("ADMIN_USERNAME", "admin").strip(),
        os.getenv("ADMIN_PASSWORD_HASH", "").strip(),
    )


@auth_bp.get("/admin/login")
def login():
    if current_user.is_authenticated:
        return redirect(url_for("admin.index"))
    return render_template("admin/login.html")


@auth_bp.post("/admin/login")
def login_post():
    login_value = (request.form.get("login") or "").strip()
    password_value = request.form.get("password") or ""
    admin_user, password_hash = _get_credentials()

    if not password_hash:
        flash("Не задан ADMIN_PASSWORD_HASH в .env", "danger")
        return redirect(url_for("auth.login"))

    username_ok = hmac.compare_digest(login_value, admin_user)
    password_ok = check_password_hash(password_hash, password_value)

    if username_ok and password_ok:
        login_user(AdminUser("admin"), remember=True)
        next_url = request.args.get("next")
        if is_safe_local_redirect(next_url):
            return redirect(next_url)
        return redirect(url_for("admin.index"))

    flash("Неверный логин или пароль", "danger")
    return redirect(url_for("auth.login"))


@auth_bp.post("/admin/logout")
def logout():
    logout_user()
    return redirect(url_for("auth.login"))
