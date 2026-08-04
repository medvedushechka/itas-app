"""Заполнение новой базы стартовым содержимым проекта.

Скрипт не перезаписывает существующие данные без явного флага ``--force``.
Исходные медиа хранятся в ``static/seed_media`` и копируются в рабочий
``static/uploads`` при первом заполнении.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import create_app
from database import db
from models import CarouselSlide, Committee, Member, News
from ticker_model import TickerItem, TickerSettings

SEED_FILE = ROOT / "seed" / "content.json"
SEED_MEDIA_DIR = ROOT / "static" / "seed_media"
UPLOAD_DIR = ROOT / "static" / "uploads"


def _parse_datetime(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def _has_content() -> bool:
    return any((
        CarouselSlide.query.first(),
        Committee.query.first(),
        Member.query.first(),
        News.query.first(),
        TickerItem.query.first(),
    ))


def _copy_seed_media() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    for source in SEED_MEDIA_DIR.iterdir():
        if source.is_file():
            target = UPLOAD_DIR / source.name
            if not target.exists():
                shutil.copy2(source, target)


def seed(force: bool = False) -> None:
    if not SEED_FILE.exists():
        raise FileNotFoundError(f"Не найден файл наполнения: {SEED_FILE}")

    if _has_content() and not force:
        print("База уже содержит данные. Наполнение пропущено.")
        return

    payload = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    if force:
        for model in (TickerItem, TickerSettings, News, Member, Committee, CarouselSlide):
            model.query.delete()
        db.session.commit()

    _copy_seed_media()

    for item in payload.get("carousel_slides", []):
        item["created_at"] = _parse_datetime(item.get("created_at"))
        db.session.add(CarouselSlide(**item))
    for item in payload.get("committees", []):
        item["created_at"] = _parse_datetime(item.get("created_at"))
        db.session.add(Committee(**item))
    for item in payload.get("members", []):
        item["created_at"] = _parse_datetime(item.get("created_at"))
        db.session.add(Member(**item))
    for item in payload.get("news", []):
        item["created_at"] = _parse_datetime(item.get("created_at"))
        item["is_published"] = bool(item.get("is_published", True))
        db.session.add(News(**item))
    for item in payload.get("ticker_items", []):
        item["is_enabled"] = bool(item.get("is_enabled", True))
        db.session.add(TickerItem(**item))
    for item in payload.get("ticker_settings", []):
        item["is_enabled"] = bool(item.get("is_enabled", False))
        db.session.add(TickerSettings(**item))

    db.session.commit()
    print("Стартовое содержимое добавлено.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Полностью заменить текущее содержимое")
    args = parser.parse_args()
    app = create_app()
    with app.app_context():
        seed(force=args.force)


if __name__ == "__main__":
    main()
