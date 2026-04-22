from app import db
from datetime import datetime
import uuid

class ChatRoom(db.Model):
    __tablename__ = 'chat_rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False, unique=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    group = db.relationship('Group', backref='chat_room')
    messages = db.relationship('ChatMessage', backref='chat_room', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ChatRoom {self.name}: {self.group_id}>'

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    chat_room_id = db.Column(db.Integer, db.ForeignKey('chat_rooms.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message_type = db.Column(db.String(20), default='text')  # text, image, file, system
    content = db.Column(db.Text, nullable=False)
    file_url = db.Column(db.String(500))  # For file/image messages
    file_name = db.Column(db.String(255))
    file_size = db.Column(db.Integer)
    reply_to_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'))  # For reply messages
    is_edited = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sender = db.relationship('User', backref='chat_messages')
    reply_to = db.relationship('ChatMessage', remote_side=[id], backref='replies')
    read_status = db.relationship('MessageReadStatus', backref='message', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ChatMessage {self.id}: {self.content[:50]}...>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'chat_room_id': self.chat_room_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.username if self.sender else 'Unknown',
            'message_type': self.message_type,
            'content': self.content,
            'file_url': self.file_url,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'reply_to_id': self.reply_to_id,
            'reply_to_content': self.reply_to.content[:100] + '...' if self.reply_to else None,
            'is_edited': self.is_edited,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class MessageReadStatus(db.Model):
    __tablename__ = 'message_read_status'
    
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='message_read_status')
    
    __table_args__ = (db.UniqueConstraint('message_id', 'user_id', name='unique_message_user'),)
    
    def __repr__(self):
        return f'<MessageReadStatus {self.message_id}: {self.user_id} - {"read" if self.is_read else "unread"}>'

class ChatInvitation(db.Model):
    __tablename__ = 'chat_invitations'
    
    id = db.Column(db.Integer, primary_key=True)
    chat_room_id = db.Column(db.Integer, db.ForeignKey('chat_rooms.id'), nullable=False)
    inviter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    invitee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    invitation_code = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, expired
    expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    chat_room = db.relationship('ChatRoom', backref='invitations')
    inviter = db.relationship('User', foreign_keys=[inviter_id], backref='sent_invitations')
    invitee = db.relationship('User', foreign_keys=[invitee_id], backref='received_invitations')
    
    def __repr__(self):
        return f'<ChatInvitation {self.inviter_id} -> {self.invitee_id}: {self.status}>'
    
    def is_expired(self):
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False 