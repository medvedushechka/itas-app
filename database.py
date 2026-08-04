"""Расширения для работы с базой данных и миграциями."""

from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()
migrate = Migrate(compare_type=True, render_as_batch=True)
