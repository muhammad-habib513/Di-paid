from app import db
from datetime import datetime

class CryptoPortfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    currency = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    value_usd = db.Column(db.Float)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='crypto_portfolio') 