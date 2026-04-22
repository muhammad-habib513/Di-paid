from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, mail
from app.models.notification import Notification
from app.models.user import User
from flask_mail import Message
from datetime import datetime
from app.utils.reminders import send_unpaid_share_reminders
from app.models.notification_preference import NotificationPreference

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/preferences', methods=['OPTIONS'])
def options_preferences():
    return '', 200

@notifications_bp.route('', methods=['POST'])
@jwt_required()
def create_notification():
    data = request.get_json()
    user_id = data.get('user_id')
    message = data.get('message')
    notif_type = data.get('type', 'info')
    notification = Notification(user_id=user_id, message=message, type=notif_type)
    db.session.add(notification)
    db.session.commit()
    return jsonify({'id': notification.id, 'message': notification.message}), 201

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def list_notifications():
    user_id = get_jwt_identity()
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([
        {'id': n.id, 'message': n.message, 'type': n.type, 'is_read': n.is_read, 'created_at': n.created_at}
        for n in notifs
    ])

@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    user_id = int(get_jwt_identity())
    pref = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.session.add(pref)
        db.session.commit()
    return jsonify(pref.to_dict())

@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    pref = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.session.add(pref)
    for key in ['email_enabled', 'push_enabled', 'sms_enabled', 'daily_summary', 'marketing_emails']:
        if key in data:
            setattr(pref, key, bool(data[key]))
    db.session.commit()
    return jsonify({'message': 'Preferences updated', 'preferences': pref.to_dict()})

@notifications_bp.route('/<int:notif_id>/mark-read', methods=['POST'])
@jwt_required()
def mark_notification_read(notif_id):
    notif = Notification.query.get_or_404(notif_id)
    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read'})

@notifications_bp.route('/send-email-reminder', methods=['POST'])
@jwt_required()
def send_email_reminder():
    data = request.get_json()
    to_user_id = data.get('to_user_id')
    subject = data.get('subject', 'Reminder')
    body = data.get('body', 'This is a reminder from Di-Paid.')
    user = User.query.get(to_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    try:
        msg = Message(subject, recipients=[user.email])
        msg.body = body
        mail.send(msg)
        return jsonify({'message': 'Email sent'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/send-unpaid-share-reminders', methods=['POST'])
@jwt_required()
def trigger_unpaid_share_reminders():
    send_unpaid_share_reminders()
    return jsonify({'message': 'Reminders sent'}), 200

@notifications_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    try:
        user_id = int(get_jwt_identity())
        Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()
        return jsonify({'message': 'All notifications marked as read'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 