from database import db


class TickerSettings(db.Model):
    __tablename__ = "ticker_settings"

    id = db.Column(db.Integer, primary_key=True)
    is_enabled = db.Column(db.Boolean, nullable=False, default=False)

    # длительность показа "одного блока" (одной новости) в секундах
    # (фактически влияет на общую длительность: speed_seconds * кол-во новостей)
    speed_seconds = db.Column(db.Integer, nullable=False, default=18)


class TickerItem(db.Model):
    __tablename__ = "ticker_items"

    id = db.Column(db.Integer, primary_key=True)
    position = db.Column(db.Integer, nullable=False, default=1, index=True)
    text = db.Column(db.Text, nullable=False, default="")
    is_enabled = db.Column(db.Boolean, nullable=False, default=True)
