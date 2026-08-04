"""Удаляет только файлы uploads, на которые не ссылается рабочая база."""

from pathlib import Path
import sqlite3


ROOT = Path(__file__).resolve().parents[1]
DATABASE = ROOT / "app.db"
UPLOADS = ROOT / "static" / "uploads"

if not DATABASE.exists():
    raise SystemExit(f"База не найдена: {DATABASE}")

connection = sqlite3.connect(DATABASE)
references: set[str] = set()
for table, column in (
    ("carousel_slides", "media_file"),
    ("members", "logo"),
    ("news", "media_file"),
):
    rows = connection.execute(
        f'SELECT {column} FROM {table} WHERE {column} IS NOT NULL AND {column} != ""'
    )
    references.update(Path(row[0]).name for row in rows)
connection.close()

missing = sorted(name for name in references if not (UPLOADS / name).is_file())
if missing:
    raise SystemExit(
        "Очистка отменена: база ссылается на отсутствующие файлы:\n" + "\n".join(missing)
    )

removed_count = 0
removed_bytes = 0
for path in UPLOADS.iterdir():
    if path.is_file() and path.name not in references:
        removed_count += 1
        removed_bytes += path.stat().st_size
        path.unlink()

print(f"Удалено файлов: {removed_count}")
print(f"Освобождено: {removed_bytes / 1024 / 1024:.2f} МБ")
