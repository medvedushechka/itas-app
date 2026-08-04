"""Общие функции очистки пользовательских данных."""

from __future__ import annotations

from urllib.parse import urljoin, urlparse

import bleach
from flask import request


ALLOWED_NEWS_TAGS = {
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "ul", "ol", "li", "blockquote", "h2", "h3", "h4", "a",
}
ALLOWED_NEWS_ATTRIBUTES = {
    "a": ["href", "title", "target", "rel"],
}
ALLOWED_NEWS_PROTOCOLS = {"http", "https", "mailto"}


def sanitize_news_html(value: str | None) -> str:
    cleaned = bleach.clean(
        value or "",
        tags=ALLOWED_NEWS_TAGS,
        attributes=ALLOWED_NEWS_ATTRIBUTES,
        protocols=ALLOWED_NEWS_PROTOCOLS,
        strip=True,
        strip_comments=True,
    )
    return bleach.linkifier.Linker(skip_tags={"pre", "code"}).linkify(cleaned)


def is_safe_local_redirect(target: str | None) -> bool:
    if not target:
        return False
    host_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in {"http", "https"} and test_url.netloc == host_url.netloc
