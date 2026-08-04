"""Настройки приложения, загружаемые из переменных окружения."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int, minimum: int | None = None) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        value = int(raw)
    except ValueError as exc:
        raise RuntimeError(f"Переменная {name} должна быть целым числом") from exc
    if minimum is not None and value < minimum:
        raise RuntimeError(f"Переменная {name} должна быть не меньше {minimum}")
    return value


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
    if not SECRET_KEY or SECRET_KEY in {"change-me", "your-secret-key-here-change-this"}:
        raise RuntimeError(
            "Не задан безопасный SECRET_KEY. Скопируйте .env.example в .env "
            "и сгенерируйте случайное значение."
        )

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{(BASE_DIR / 'app.db').as_posix()}",
    ).strip()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = _env_bool("SESSION_COOKIE_SECURE", False)
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"
    REMEMBER_COOKIE_SECURE = SESSION_COOKIE_SECURE

    MAX_CONTENT_LENGTH = _env_int("MAX_UPLOAD_MB", 80, minimum=1) * 1024 * 1024
    TRUST_PROXY_HEADERS = _env_bool("TRUST_PROXY_HEADERS", False)
    CONTACT_RATE_LIMIT_SECONDS = _env_int("CONTACT_RATE_LIMIT_SECONDS", 30, minimum=1)
