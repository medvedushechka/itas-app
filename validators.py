"""Повторно используемые проверки данных приложения."""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse

from email_validator import EmailNotValidError, validate_email
from wtforms.validators import ValidationError


_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def clean_single_line(value: object, *, max_length: int) -> str:
    """Очистить однострочное поле и ограничить его длину."""
    text = _CONTROL_CHARS_RE.sub("", str(value or ""))
    text = " ".join(text.replace("\r", " ").replace("\n", " ").split())
    return text[:max_length]


def clean_multiline(value: object, *, max_length: int) -> str:
    """Нормализовать переносы строк и удалить управляющие символы."""
    text = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
    text = _CONTROL_CHARS_RE.sub("", text)
    return text.strip()[:max_length]


def normalize_email(value: object) -> str:
    """Проверить адрес электронной почты и вернуть нормализованное значение."""
    raw = clean_single_line(value, max_length=200)
    if not raw:
        return ""
    try:
        result = validate_email(raw, check_deliverability=False)
    except EmailNotValidError as exc:
        raise ValueError("Некорректный email") from exc
    return result.normalized


def validate_http_url(_form, field) -> None:
    """Разрешить только абсолютные HTTP- и HTTPS-ссылки."""
    value = (field.data or "").strip()
    if not value:
        return
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValidationError("Укажите полную ссылку, начинающуюся с http:// или https://")


@dataclass(frozen=True)
class ContactMessage:
    name: str
    email: str
    subject: str
    message: str


def parse_contact_payload(data: object) -> ContactMessage:
    """Проверить JSON формы обратной связи."""
    if not isinstance(data, dict):
        raise ValueError("Ожидался JSON-объект")

    honeypot = clean_single_line(data.get("company"), max_length=200)
    if honeypot:
        raise ValueError("Не удалось отправить сообщение")

    name = clean_single_line(data.get("name"), max_length=120)
    email = normalize_email(data.get("email"))
    subject = clean_single_line(data.get("subject"), max_length=160)
    message = clean_multiline(data.get("message"), max_length=5000)

    if len(message) < 10:
        raise ValueError("Сообщение должно содержать не менее 10 символов")
    if not name and not email:
        raise ValueError("Укажите имя или email для ответа")

    return ContactMessage(
        name=name,
        email=email,
        subject=subject or "Сообщение с сайта",
        message=message,
    )
