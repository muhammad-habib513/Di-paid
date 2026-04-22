from app import db
from datetime import datetime

class NotificationPreference(db.Model):
    __tablename__ = 'notification_preference'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)

    email_enabled = db.Column(db.Boolean, default=True, nullable=False)
    push_enabled = db.Column(db.Boolean, default=True, nullable=False)
    sms_enabled = db.Column(db.Boolean, default=False, nullable=False)
    daily_summary = db.Column(db.Boolean, default=False, nullable=False)
    marketing_emails = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'email_enabled': self.email_enabled,
            'push_enabled': self.push_enabled,
            'sms_enabled': self.sms_enabled,
            'daily_summary': self.daily_summary,
            'marketing_emails': self.marketing_emails,
        } 