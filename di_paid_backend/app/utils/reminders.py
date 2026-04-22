from app import db, mail
from app.models.expense_share import ExpenseShare
from app.models.user import User
from app.models.notification import Notification
from flask_mail import Message
from datetime import datetime, timedelta

def send_unpaid_share_reminders(days_overdue=3):
    now = datetime.utcnow()
    overdue = now - timedelta(days=days_overdue)
    shares = ExpenseShare.query.filter_by(paid=False).all()
    for share in shares:
        # For demo, assume expense has a created_at (or use paid_at for real logic)
        if hasattr(share, 'created_at') and share.created_at and share.created_at < overdue:
            user = User.query.get(share.user_id)
            if user:
                # In-app notification
                notif = Notification(user_id=user.id, message=f'Reminder: You still owe {share.amount} for an expense.', type='reminder')
                db.session.add(notif)
                # Email reminder
                try:
                    msg = Message('Payment Reminder', recipients=[user.email])
                    msg.body = f'Reminder: You still owe {share.amount} for an expense.'
                    mail.send(msg)
                except Exception:
                    pass
    db.session.commit() 