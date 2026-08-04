from datetime import datetime
from database import db


class CarouselSlide(db.Model):
    __tablename__ = "carousel_slides"

    id = db.Column(db.Integer, primary_key=True)
    position = db.Column(db.Integer, default=0, nullable=False)

    # Имя файла в каталоге static/uploads
    media_file = db.Column(db.String(255), nullable=False)
    media_type = db.Column(db.String(20), default="image", nullable=False)  # image, gif или video

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @property
    def media_url(self) -> str:
        return f"/static/uploads/{self.media_file}" if self.media_file else ""


class Committee(db.Model):
    __tablename__ = "committees"

    id = db.Column(db.Integer, primary_key=True)
    position = db.Column(db.Integer, default=0, nullable=False)

    title = db.Column(db.String(255), nullable=False)
    bullets = db.Column(db.Text, default="", nullable=False)  # Каждый пункт хранится с новой строки
    tag = db.Column(db.String(80), default="", nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Member(db.Model):
    __tablename__ = "members"

    id = db.Column(db.Integer, primary_key=True)
    position = db.Column(db.Integer, default=0, nullable=False)

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default="", nullable=False)
    url = db.Column(db.String(255), default="", nullable=False)

    # Имя файла в каталоге static/uploads
    logo = db.Column(db.String(255), default="", nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @property
    def logo_url(self) -> str:
        return f"/static/uploads/{self.logo}" if self.logo else ""


class News(db.Model):
    __tablename__ = "news"

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    title = db.Column(db.String(255), nullable=False)
    content_html = db.Column(db.Text, default="", nullable=False)

    # Имя файла в каталоге static/uploads
    media_file = db.Column(db.String(255), default="", nullable=False)
    media_type = db.Column(db.String(20), default="image", nullable=False)  # image, gif или video

    size = db.Column(db.String(20), default="small", nullable=False)  # big или small
    is_published = db.Column(db.Boolean, default=True, nullable=False)

    @property
    def media_url(self) -> str:
        return f"/static/uploads/{self.media_file}" if self.media_file else ""
 