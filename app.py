from __future__ import annotations

import logging
import os
import time
from collections import OrderedDict

import click
from flask import Flask, jsonify, render_template, request
from flask_wtf.csrf import CSRFError, CSRFProtect
from werkzeug.middleware.proxy_fix import ProxyFix

from admin import setup_admin
from auth import auth_bp, login_manager
from config import Config
from database import db, migrate
from emailer import send_contact_email
from models import CarouselSlide, Committee, Member, News
from security import sanitize_news_html
from ticker_model import TickerItem, TickerSettings
from validators import parse_contact_payload


csrf = CSRFProtect()


def _media_url(filename: str | None) -> str:
    if not filename:
        return ""
    return f"/static/uploads/{os.path.basename(filename)}"


def create_app() -> Flask:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.from_object(Config)

    if app.config["TRUST_PROXY_HEADERS"]:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    login_manager.init_app(app)
    app.register_blueprint(auth_bp)
    setup_admin(app)

    @app.after_request
    def set_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.errorhandler(CSRFError)
    def handle_csrf_error(error):
        if request.path.startswith("/api/"):
            return jsonify({"ok": False, "error": "Недействительный CSRF-токен"}), 400
        return render_template("admin/login.html", csrf_error=error.description), 400

    @app.errorhandler(413)
    def payload_too_large(_error):
        return jsonify({"ok": False, "error": "Загружаемый файл превышает допустимый размер"}), 413

    @app.cli.command("init-db")
    def init_db_command():
        """Создать отсутствующие таблицы и начальные настройки."""
        db.create_all()
        settings = TickerSettings.query.order_by(TickerSettings.id.asc()).first()
        if not settings:
            db.session.add(TickerSettings(is_enabled=False, speed_seconds=18))
            db.session.commit()
        click.echo("База данных инициализирована.")

    @app.get("/")
    def home():
        return render_template("index.html")

    @app.get("/health")
    def health():
        return jsonify({"status": "healthy"})

    @app.get("/api/carousel")
    def api_carousel():
        items = CarouselSlide.query.order_by(CarouselSlide.position.asc(), CarouselSlide.id.asc()).all()
        return jsonify([
            {
                "id": item.id,
                "position": item.position,
                "media_type": item.media_type,
                "media_url": _media_url(item.media_file),
            }
            for item in items
        ])

    @app.get("/api/committees")
    def api_committees():
        items = Committee.query.order_by(Committee.position.asc(), Committee.id.asc()).all()
        return jsonify([
            {
                "id": item.id,
                "position": item.position,
                "title": item.title,
                "bullets": item.bullets,
                "tag": item.tag,
            }
            for item in items
        ])

    @app.get("/api/members")
    def api_members():
        items = Member.query.order_by(Member.position.asc(), Member.id.asc()).all()
        return jsonify([
            {
                "id": item.id,
                "position": item.position,
                "name": item.name,
                "description": item.description,
                "url": item.url if (item.url or "").lower().startswith(("http://", "https://")) else "",
                "logo_url": _media_url(item.logo),
            }
            for item in items
        ])

    @app.get("/api/news")
    def api_news():
        items = (
            News.query
            .filter(News.is_published.is_(True))
            .order_by(News.created_at.desc(), News.id.desc())
            .all()
        )
        return jsonify([
            {
                "id": item.id,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "title": item.title,
                "content_html": sanitize_news_html(item.content_html),
                "media_type": item.media_type,
                "media_url": _media_url(item.media_file),
                "size": item.size if item.size in {"small", "big"} else "small",
            }
            for item in items
        ])

    @app.get("/api/ticker")
    def api_ticker():
        settings = TickerSettings.query.order_by(TickerSettings.id.asc()).first()
        items = (
            TickerItem.query
            .filter(TickerItem.is_enabled.is_(True))
            .order_by(TickerItem.position.asc(), TickerItem.id.asc())
            .all()
        )
        speed = settings.speed_seconds if settings else 18
        return jsonify({
            "is_enabled": bool(settings and settings.is_enabled),
            "speed_seconds": max(2, min(int(speed or 18), 120)),
            "items": [
                {"id": item.id, "position": item.position, "text": item.text or ""}
                for item in items
            ],
        })

    contact_attempts: OrderedDict[str, float] = OrderedDict()

    @app.post("/api/contact")
    def api_contact_send():
        if not request.is_json:
            return jsonify({"ok": False, "error": "Ожидался JSON-запрос"}), 415

        try:
            contact = parse_contact_payload(request.get_json(silent=True))
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400

        ip = request.remote_addr or "unknown"
        now = time.monotonic()
        cooldown = app.config["CONTACT_RATE_LIMIT_SECONDS"]

        while contact_attempts:
            first_ip, timestamp = next(iter(contact_attempts.items()))
            if now - timestamp <= max(cooldown * 10, 600):
                break
            contact_attempts.pop(first_ip, None)
        while len(contact_attempts) > 5000:
            contact_attempts.popitem(last=False)

        last = contact_attempts.get(ip, 0.0)
        if now - last < cooldown:
            return jsonify({"ok": False, "error": "Слишком часто. Попробуйте чуть позже."}), 429
        contact_attempts[ip] = now
        contact_attempts.move_to_end(ip)

        to_email = os.getenv("CONTACT_TO", "").strip()
        if not to_email:
            app.logger.error("Не задан CONTACT_TO")
            return jsonify({"ok": False, "error": "Форма временно недоступна"}), 503

        body = (
            "Новое сообщение с сайта:\n\n"
            f"Имя: {contact.name or '-'}\n"
            f"Email: {contact.email or '-'}\n"
            f"Тема: {contact.subject}\n"
            "------------------------------\n"
            f"{contact.message}\n"
        )

        try:
            send_contact_email(
                to_email=to_email,
                subject=f"[SITE] {contact.subject}",
                body_text=body,
                reply_to=contact.email or None,
            )
        except Exception:
            app.logger.exception("Не удалось отправить сообщение из формы обратной связи")
            return jsonify({"ok": False, "error": "Не удалось отправить сообщение. Попробуйте позже."}), 502

        return jsonify({"ok": True})

    return app


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    create_app().run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
