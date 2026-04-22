from app import db

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    contact_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending/accepted/blocked

    user = db.relationship('User', foreign_keys=[user_id], backref='contacts')
    contact_user = db.relationship('User', foreign_keys=[contact_user_id]) 