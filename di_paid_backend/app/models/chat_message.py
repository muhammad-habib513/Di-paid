from app import db
from datetime import datetime

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'))
    from_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # nullable for group chat
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    group = db.relationship('Group', backref='chat_messages')
    from_user = db.relationship('User', foreign_keys=[from_user_id], backref='messages_sent')
    to_user = db.relationship('User', foreign_keys=[to_user_id], backref='messages_received') 