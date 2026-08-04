"""Создание локального .env без сохранения пароля в открытом виде."""

from __future__ import annotations

import getpass
import secrets
from pathlib import Path

from werkzeug.security import generate_password_hash


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"


def main() -> None:
    if ENV_PATH.exists():
        print("Файл .env уже существует, изменения не внесены.")
        return

    login = input("Логин администратора [admin]: ").strip() or "admin"
    while True:
        password = getpass.getpass("Пароль администратора: ")
        repeat = getpass.getpass("Повторите пароль: ")
        if len(password) < 10:
            print("Пароль должен содержать не менее 10 символов.")
            continue
        if password != repeat:
            print("Пароли не совпадают.")
            continue
        break

    content = f'''SECRET_KEY="{secrets.token_urlsafe(48)}"
ADMIN_USERNAME="{login}"
ADMIN_PASSWORD_HASH="{generate_password_hash(password)}"
DATABASE_URL="sqlite:///{(ROOT / 'app.db').as_posix()}"
SESSION_COOKIE_SECURE=false
TRUST_PROXY_HEADERS=false
MAX_UPLOAD_MB=80
CONTACT_RATE_LIMIT_SECONDS=30

CONTACT_TO=""
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_USE_SSL=1
'''
    ENV_PATH.write_text(content, encoding="utf-8")
    print("Файл .env создан.")


if __name__ == "__main__":
    main()
