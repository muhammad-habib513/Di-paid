from app import db
from datetime import datetime

class Activity(db.Model):
    __tablename__ = 'activities'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # expense_created, payment_sent, group_joined, etc.
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    resource_type = db.Column(db.String(50))  # expense, payment, group, etc.
    resource_id = db.Column(db.Integer)  # ID of the related resource
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'))  # If activity is group-related
    activity_metadata = db.Column(db.Text)  # JSON string for additional data
    is_public = db.Column(db.Boolean, default=True)  # Whether friends can see this activity
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='activities')
    group = db.relationship('Group', backref='activities')
    
    def __repr__(self):
        return f'<Activity {self.activity_type}: {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'title': self.title,
            'description': self.description,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'group_id': self.group_id,
            'activity_metadata': self.activity_metadata,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def log_activity(cls, user_id, activity_type, title, description=None, 
                    resource_type=None, resource_id=None, group_id=None, 
                    activity_metadata=None, is_public=True):
        """Log a new activity"""
        activity = cls(
            user_id=user_id,
            activity_type=activity_type,
            title=title,
            description=description,
            resource_type=resource_type,
            resource_id=resource_id,
            group_id=group_id,
            activity_metadata=activity_metadata,
            is_public=is_public
        )
        db.session.add(activity)
        db.session.commit()
        return activity 