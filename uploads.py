"""Проверка и сохранение файлов, загружаемых через административную панель."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from flask import current_app
from PIL import Image, ImageOps, UnidentifiedImageError
from werkzeug.datastructures import FileStorage


IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
GIF_EXTENSIONS = {"gif"}
VIDEO_EXTENSIONS = {"mp4", "webm", "mov"}
ALLOWED_MEDIA_EXTENSIONS = IMAGE_EXTENSIONS | GIF_EXTENSIONS | VIDEO_EXTENSIONS
ALLOWED_LOGO_EXTENSIONS = IMAGE_EXTENSIONS | GIF_EXTENSIONS

MAX_IMAGE_BYTES = 12 * 1024 * 1024
MAX_GIF_BYTES = 25 * 1024 * 1024
MAX_VIDEO_BYTES = 80 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000
MAX_IMAGE_SIDE = 2560
WEBP_QUALITY = 88

IMAGE_FORMAT_TO_EXTENSION = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
    "GIF": "gif",
}


class UploadValidationError(ValueError):
    pass


def uploads_dir() -> Path:
    path = Path(current_app.static_folder) / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _file_size(file_storage: FileStorage) -> int:
    stream = file_storage.stream
    current = stream.tell()
    stream.seek(0, os.SEEK_END)
    size = stream.tell()
    stream.seek(current)
    return size


def _validate_image(file_storage: FileStorage, allowed_exts: set[str]) -> tuple[str, str]:
    stream = file_storage.stream
    stream.seek(0)
    try:
        with Image.open(stream) as image:
            image.verify()
            actual_format = (image.format or "").upper()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise UploadValidationError("Файл не является корректным изображением") from exc
    finally:
        stream.seek(0)

    ext = IMAGE_FORMAT_TO_EXTENSION.get(actual_format)
    if not ext or ext not in allowed_exts:
        raise UploadValidationError(f"Формат изображения {actual_format or 'не определён'} не поддерживается")

    stream.seek(0)
    try:
        with Image.open(stream) as image:
            width, height = image.size
    finally:
        stream.seek(0)

    if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
        raise UploadValidationError("Слишком большое разрешение изображения")

    media_type = "gif" if ext == "gif" else "image"
    limit = MAX_GIF_BYTES if media_type == "gif" else MAX_IMAGE_BYTES
    if _file_size(file_storage) > limit:
        raise UploadValidationError(
            f"Файл слишком большой. Максимум: {limit // (1024 * 1024)} МБ"
        )
    return ext, media_type


def _validate_video(file_storage: FileStorage, ext: str) -> tuple[str, str]:
    if _file_size(file_storage) > MAX_VIDEO_BYTES:
        raise UploadValidationError(
            f"Видео слишком большое. Максимум: {MAX_VIDEO_BYTES // (1024 * 1024)} МБ"
        )

    stream = file_storage.stream
    stream.seek(0)
    head = stream.read(64)
    stream.seek(0)

    valid = False
    if ext in {"mp4", "mov"}:
        valid = len(head) >= 12 and head[4:8] == b"ftyp"
    elif ext == "webm":
        valid = head.startswith(b"\x1a\x45\xdf\xa3")

    if not valid:
        raise UploadValidationError("Содержимое файла не соответствует заявленному видеоформату")
    return ext, "video"


def validate_upload(file_storage: FileStorage, allowed_exts: set[str]) -> tuple[str, str]:
    filename = (file_storage.filename or "").strip()
    if not filename:
        raise UploadValidationError("Не выбрано имя файла")

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in allowed_exts:
        raise UploadValidationError(f"Недопустимое расширение файла: .{ext or 'без расширения'}")

    if ext in IMAGE_EXTENSIONS | GIF_EXTENSIONS:
        return _validate_image(file_storage, allowed_exts)
    return _validate_video(file_storage, ext)


def _save_optimized_image(file_storage: FileStorage, destination: Path) -> None:
    """Сохранить обычное изображение в WebP и ограничить чрезмерное разрешение."""
    file_storage.stream.seek(0)
    try:
        with Image.open(file_storage.stream) as source:
            image = ImageOps.exif_transpose(source)
            image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.Resampling.LANCZOS)

            has_alpha = image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info)
            image = image.convert("RGBA" if has_alpha else "RGB")
            image.save(
                destination,
                format="WEBP",
                quality=WEBP_QUALITY,
                method=6,
                lossless=has_alpha,
            )
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        destination.unlink(missing_ok=True)
        raise UploadValidationError("Не удалось обработать изображение") from exc
    finally:
        file_storage.stream.seek(0)


def save_upload(file_storage: FileStorage | None, allowed_exts: set[str]) -> tuple[str, str] | None:
    if not file_storage or not (file_storage.filename or "").strip():
        return None

    ext, media_type = validate_upload(file_storage, allowed_exts)

    if media_type == "image":
        new_name = f"{uuid.uuid4().hex}.webp"
        _save_optimized_image(file_storage, uploads_dir() / new_name)
        return new_name, media_type

    new_name = f"{uuid.uuid4().hex}.{ext}"
    destination = uploads_dir() / new_name
    file_storage.stream.seek(0)
    file_storage.save(destination)
    return new_name, media_type


def delete_upload(filename: str | None) -> None:
    if not filename:
        return
    safe_name = Path(filename).name
    path = uploads_dir() / safe_name
    try:
        path.unlink(missing_ok=True)
    except OSError:
        current_app.logger.exception("Не удалось удалить старый загруженный файл %s", safe_name)
