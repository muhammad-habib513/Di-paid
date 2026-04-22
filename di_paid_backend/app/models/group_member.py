from app import db
from datetime import datetime

class GroupMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(20), default='member')  # admin/member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    group = db.relationship('Group', backref='members')
    user = db.relationship('User', backref='group_memberships') 