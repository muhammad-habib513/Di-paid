from app import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.Text)
    payment_method = db.Column(db.String(50), default='cash')  # cash, bank_transfer, paypal, venmo, other
    status = db.Column(db.String(20), default='pending')  # pending, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    group = db.relationship('Group', backref='payments')
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_payments')
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='received_payments')
    
    def __repr__(self):
        return f'<Payment {self.id}: ${self.amount} from {self.sender_id} to {self.recipient_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'group_id': self.group_id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'amount': float(self.amount) if self.amount else 0,
            'description': self.description,
            'payment_method': self.payment_method,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        } 