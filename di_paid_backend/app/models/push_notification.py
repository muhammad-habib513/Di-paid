from app import db
from datetime import datetime
import json

class PushNotification(db.Model):
    __tablename__ = 'push_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # expense, payment, group, friend, etc.
    resource_type = db.Column(db.String(50))  # expense, payment, group, etc.
    resource_id = db.Column(db.Integer)  # ID of the related resource
    data = db.Column(db.Text)  # JSON string with additional data
    device_token = db.Column(db.String(255))  # FCM device token
    sent_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    read_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')  # pending, sent, delivered, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='push_notifications')
    
    def __repr__(self):
        return f'<PushNotification {self.notification_type}: {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'body': self.body,
            'notification_type': self.notification_type,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'data': self.data,
            'device_token': self.device_token,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def create_notification(cls, user_id, title, body, notification_type, 
                          resource_type=None, resource_id=None, data=None, device_token=None):
        """Create a new push notification"""
        notification = cls(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
            resource_type=resource_type,
            resource_id=resource_id,
            data=json.dumps(data) if data else None,
            device_token=device_token
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    
    def mark_as_sent(self):
        """Mark notification as sent"""
        self.sent_at = datetime.utcnow()
        self.status = 'sent'
        db.session.commit()
    
    def mark_as_delivered(self):
        """Mark notification as delivered"""
        self.delivered_at = datetime.utcnow()
        self.status = 'delivered'
        db.session.commit()
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.read_at = datetime.utcnow()
        db.session.commit()
    
    def mark_as_failed(self):
        """Mark notification as failed"""
        self.status = 'failed'
        db.session.commit() 