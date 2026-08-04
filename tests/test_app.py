from __future__ import annotations

import re

from database import db
from models import News


def _csrf_token(client) -> str:
    response = client.get("/")
    match = re.search(rb'name="csrf-token" content="([^"]+)"', response.data)
    assert match
    return match.group(1).decode()


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "healthy"}


def test_admin_requires_login(client):
    response = client.get("/admin/", follow_redirects=False)
    assert response.status_code in {301, 302}
    assert "/admin/login" in response.headers["Location"]


def test_login_rejects_external_redirect(client):
    page = client.get("/admin/login")
    match = re.search(rb'name="csrf_token"[^>]*value="([^"]+)"', page.data)
    assert match
    response = client.post(
        "/admin/login?next=https://example.org/phishing",
        data={
            "csrf_token": match.group(1).decode(),
            "login": "admin",
            "password": "test-password",
        },
        follow_redirects=False,
    )
    assert response.status_code in {301, 302}
    assert response.headers["Location"].endswith("/admin/")


def test_news_api_hides_drafts_and_sanitizes_html(app, client):
    with app.app_context():
        db.session.add_all([
            News(title="Опубликовано", content_html='<p>Текст</p><script>alert(1)</script>', is_published=True),
            News(title="Черновик", content_html="Скрыто", is_published=False),
        ])
        db.session.commit()

    response = client.get("/api/news")
    payload = response.get_json()
    assert [item["title"] for item in payload] == ["Опубликовано"]
    assert "script" not in payload[0]["content_html"].lower()


def test_contact_requires_csrf(client):
    response = client.post(
        "/api/contact",
        json={"name": "Иван", "message": "Достаточно длинное сообщение"},
    )
    assert response.status_code == 400


def test_contact_validation_with_csrf(client):
    token = _csrf_token(client)
    response = client.post(
        "/api/contact",
        json={"name": "Иван", "email": "bad", "message": "Достаточно длинное сообщение"},
        headers={"X-CSRFToken": token},
    )
    assert response.status_code == 400
    assert response.get_json()["error"] == "Некорректный email"
