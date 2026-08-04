"""Проверка, что все медиафайлы из рабочей базы существуют на диске."""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATABASE = ROOT / "app.db"
UPLOADS = ROOT / "static" / "uploads"
SOURCES = (
    ("carousel_slides", "media_file"),
    ("members", "logo"),
    ("news", "media_file"),
)


def main() -> int:
    if not DATABASE.is_file():
        print(f"База не найдена: {DATABASE}")
        return 1

    missing: list[str] = []
    referenced: set[str] = set()

    with sqlite3.connect(DATABASE) as connection:
        for table, column in SOURCES:
            rows = connection.execute(
                f"SELECT id, {column} FROM {table} WHERE {column} IS NOT NULL AND {column} != ''"
            )
            for row_id, filename in rows:
                referenced.add(filename)
                if not (UPLOADS / Path(filename).name).is_file():
                    missing.append(f"{table} #{row_id}: {filename}")

    if missing:
        print("Не найдены файлы:")
        for item in missing:
            print(f"- {item}")
        return 1

    files = {path.name for path in UPLOADS.iterdir() if path.is_file()}
    unused = sorted(files - {Path(name).name for name in referenced})

    print(f"Ссылок в базе: {len(referenced)}")
    print(f"Файлов в uploads: {len(files)}")
    print("Все используемые медиафайлы существуют.")
    if unused:
        print(f"Неиспользуемых файлов: {len(unused)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
