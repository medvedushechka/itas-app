from __future__ import annotations

import os
from pathlib import Path

import pytest
from werkzeug.security import generate_password_hash


os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-long-enough")
os.environ.setdefault("ADMIN_USERNAME", "admin")
os.environ.setdefault("ADMIN_PASSWORD_HASH", generate_password_hash("test-password"))
os.environ.setdefault("CONTACT_TO", "association@example.com")
os.environ.setdefault("CONTACT_RATE_LIMIT_SECONDS", "1")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app import create_app
from database import db


@pytest.fixture()
def app():
    application = create_app()
    application.config.update(
        TESTING=True,
        WTF_CSRF_TIME_LIMIT=None,
        SERVER_NAME="localhost",
    )
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()
