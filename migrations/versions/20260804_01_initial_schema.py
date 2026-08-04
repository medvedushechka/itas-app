"""Начальная схема приложения.

Миграция учитывает существующую app.db и создаёт только отсутствующие таблицы.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260804_01"
down_revision = None
branch_labels = None
depends_on = None


def _tables() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def upgrade():
    tables = _tables()

    if "carousel_slides" not in tables:
        op.create_table(
            "carousel_slides",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("media_file", sa.String(length=255), nullable=False),
            sa.Column("media_type", sa.String(length=20), nullable=False, server_default="image"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )

    if "committees" not in tables:
        op.create_table(
            "committees",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("bullets", sa.Text(), nullable=False, server_default=""),
            sa.Column("tag", sa.String(length=80), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )

    if "members" not in tables:
        op.create_table(
            "members",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=False, server_default=""),
            sa.Column("url", sa.String(length=255), nullable=False, server_default=""),
            sa.Column("logo", sa.String(length=255), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )

    if "news" not in tables:
        op.create_table(
            "news",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("content_html", sa.Text(), nullable=False, server_default=""),
            sa.Column("media_file", sa.String(length=255), nullable=False, server_default=""),
            sa.Column("media_type", sa.String(length=20), nullable=False, server_default="image"),
            sa.Column("size", sa.String(length=20), nullable=False, server_default="small"),
            sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()),
        )

    if "ticker_settings" not in tables:
        op.create_table(
            "ticker_settings",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("speed_seconds", sa.Integer(), nullable=False, server_default="18"),
        )

    if "ticker_items" not in tables:
        op.create_table(
            "ticker_items",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("position", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("text", sa.Text(), nullable=False, server_default=""),
            sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        )

    inspector = sa.inspect(op.get_bind())
    ticker_indexes = {item["name"] for item in inspector.get_indexes("ticker_items")}
    if "ix_ticker_items_position" not in ticker_indexes:
        op.create_index("ix_ticker_items_position", "ticker_items", ["position"], unique=False)

    settings_exists = op.get_bind().execute(sa.text("SELECT 1 FROM ticker_settings LIMIT 1")).first()
    if not settings_exists:
        op.get_bind().execute(
            sa.text("INSERT INTO ticker_settings (is_enabled, speed_seconds) VALUES (0, 18)")
        )


def downgrade():
    for table_name in (
        "ticker_items",
        "ticker_settings",
        "news",
        "members",
        "committees",
        "carousel_slides",
    ):
        if table_name in _tables():
            op.drop_table(table_name)
