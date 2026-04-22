from app import db
from datetime import datetime

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'))
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    date = db.Column(db.Date)
    notes = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    currency = db.Column(db.String(10), nullable=False, default='USD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    group = db.relationship('Group', backref='expenses')
    creator = db.relationship('User', backref='created_expenses')
    category = db.relationship('Category', backref='expenses') 