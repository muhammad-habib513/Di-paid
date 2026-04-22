from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.payment import Payment
from app.models.group import Group
from app.models.user import User
from app.models.group_member import GroupMember
from datetime import datetime
from app.models.notification import Notification

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('', methods=['POST'])
@jwt_required()
def create_payment():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        group_id = data.get('group_id')
        recipient_id = data.get('recipient_id')
        amount = data.get('amount')
        description = data.get('description', '')
        payment_method = data.get('payment_method', 'cash')
        
        if not all([group_id, recipient_id, amount]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Verify group exists and user is a member
        group = Group.query.get_or_404(group_id)
        membership = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
        if not membership:
            return jsonify({'error': 'You are not a member of this group'}), 403
        
        # Verify recipient is a member of the group
        recipient_membership = GroupMember.query.filter_by(group_id=group_id, user_id=recipient_id).first()
        if not recipient_membership:
            return jsonify({'error': 'Recipient is not a member of this group'}), 400
        
        # Verify recipient is not the same as sender
        if user_id == recipient_id:
            return jsonify({'error': 'Cannot send payment to yourself'}), 400
        
        payment = Payment(
            group_id=group_id,
            sender_id=user_id,
            recipient_id=recipient_id,
            amount=amount,
            description=description,
            payment_method=payment_method,
            status='pending'
        )
        db.session.add(payment)
        
        # Create notification for recipient
        recipient = User.query.get(recipient_id)
        sender = User.query.get(user_id)
        notif = Notification(
            user_id=recipient_id,
            message=f'{sender.username} sent you ${amount:.2f} for {description or "payment"}',
            type='payment'
        )
        db.session.add(notif)
        
        db.session.commit()
        
        return jsonify({
            'id': payment.id,
            'group_id': payment.group_id,
            'sender_id': payment.sender_id,
            'sender_name': sender.username,
            'recipient_id': payment.recipient_id,
            'recipient_name': recipient.username,
            'amount': payment.amount,
            'description': payment.description,
            'payment_method': payment.payment_method,
            'status': payment.status,
            'created_at': payment.created_at.isoformat() if payment.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payments_bp.route('', methods=['GET'])
@jwt_required()
def list_payments():
    try:
        user_id = get_jwt_identity()
        group_id = request.args.get('group_id', type=int)
        
        if group_id:
            # Get payments for specific group
            payments = Payment.query.filter_by(group_id=group_id).all()
        else:
            # Get all payments where user is involved (sender or recipient)
            payments = Payment.query.filter(
                (Payment.sender_id == user_id) | (Payment.recipient_id == user_id)
            ).all()
        
        result = []
        for payment in payments:
            sender = User.query.get(payment.sender_id)
            recipient = User.query.get(payment.recipient_id)
            group = Group.query.get(payment.group_id)
            
            result.append({
                'id': payment.id,
                'group_id': payment.group_id,
                'group_name': group.name if group else 'Unknown Group',
                'sender_id': payment.sender_id,
                'sender_name': sender.username if sender else 'Unknown',
                'recipient_id': payment.recipient_id,
                'recipient_name': recipient.username if recipient else 'Unknown',
                'amount': payment.amount,
                'description': payment.description,
                'payment_method': payment.payment_method,
                'status': payment.status,
                'created_at': payment.created_at.isoformat() if payment.created_at else None,
                'completed_at': payment.completed_at.isoformat() if payment.completed_at else None
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    try:
        user_id = get_jwt_identity()
        payment = Payment.query.get_or_404(payment_id)
        
        # Check if user has access to this payment
        if payment.sender_id != user_id and payment.recipient_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        sender = User.query.get(payment.sender_id)
        recipient = User.query.get(payment.recipient_id)
        group = Group.query.get(payment.group_id)
        
        return jsonify({
            'id': payment.id,
            'group_id': payment.group_id,
            'group_name': group.name if group else 'Unknown Group',
            'sender_id': payment.sender_id,
            'sender_name': sender.username if sender else 'Unknown',
            'recipient_id': payment.recipient_id,
            'recipient_name': recipient.username if recipient else 'Unknown',
            'amount': payment.amount,
            'description': payment.description,
            'payment_method': payment.payment_method,
            'status': payment.status,
            'created_at': payment.created_at.isoformat() if payment.created_at else None,
            'completed_at': payment.completed_at.isoformat() if payment.completed_at else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/<int:payment_id>', methods=['PUT'])
@jwt_required()
def update_payment(payment_id):
    try:
        user_id = get_jwt_identity()
        payment = Payment.query.get_or_404(payment_id)
        
        # Only sender can update payment
        if payment.sender_id != user_id:
            return jsonify({'error': 'Only the payment sender can update it'}), 403
        
        data = request.get_json()
        if 'description' in data:
            payment.description = data['description']
        if 'payment_method' in data:
            payment.payment_method = data['payment_method']
        
        db.session.commit()
        return jsonify({'message': 'Payment updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/<int:payment_id>', methods=['DELETE'])
@jwt_required()
def delete_payment(payment_id):
    try:
        user_id = get_jwt_identity()
        payment = Payment.query.get_or_404(payment_id)
        
        # Only sender can delete payment
        if payment.sender_id != user_id:
            return jsonify({'error': 'Only the payment sender can delete it'}), 403
        
        # Only pending payments can be deleted
        if payment.status != 'pending':
            return jsonify({'error': 'Only pending payments can be deleted'}), 400
        
        db.session.delete(payment)
        db.session.commit()
        return jsonify({'message': 'Payment deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/<int:payment_id>/receive', methods=['POST'])
@jwt_required()
def mark_payment_received(payment_id):
    try:
        user_id = int(get_jwt_identity())
        payment = Payment.query.get_or_404(payment_id)
        
        # Only recipient can mark payment as received
        if payment.recipient_id != user_id:
            return jsonify({'error': 'Only the payment recipient can mark it as received'}), 403
        
        # Only pending payments can be marked as received
        if payment.status != 'pending':
            return jsonify({'error': 'Payment is not pending'}), 400
        
        payment.status = 'completed'
        payment.completed_at = datetime.utcnow()
        
        # Create notification for sender
        sender = User.query.get(payment.sender_id)
        recipient = User.query.get(payment.recipient_id)
        notif = Notification(
            user_id=payment.sender_id,
            message=f'{recipient.username} confirmed receiving ${payment.amount:.2f}',
            type='payment_confirmed'
        )
        db.session.add(notif)
        
        db.session.commit()
        return jsonify({'message': 'Payment marked as received successfully', 'payment': payment.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_payment_stats():
    try:
        user_id = get_jwt_identity()
        
        # Get user's total sent payments
        total_sent = db.session.query(db.func.sum(Payment.amount)).filter_by(sender_id=user_id, status='completed').scalar() or 0
        
        # Get user's total received payments
        total_received = db.session.query(db.func.sum(Payment.amount)).filter_by(recipient_id=user_id, status='completed').scalar() or 0
        
        # Get pending payments to user
        pending_to_user = db.session.query(db.func.sum(Payment.amount)).filter_by(recipient_id=user_id, status='pending').scalar() or 0
        
        # Get pending payments from user
        pending_from_user = db.session.query(db.func.sum(Payment.amount)).filter_by(sender_id=user_id, status='pending').scalar() or 0
        
        return jsonify({
            'total_sent': float(total_sent),
            'total_received': float(total_received),
            'pending_to_user': float(pending_to_user),
            'pending_from_user': float(pending_from_user),
            'net_flow': float(total_received - total_sent)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/balances', methods=['GET'])
@jwt_required()
def get_user_balances():
    try:
        user_id = get_jwt_identity()
        
        # Get all groups where user is a member
        user_groups = GroupMember.query.filter_by(user_id=user_id).all()
        balances = []
        
        for membership in user_groups:
            group = Group.query.get(membership.group_id)
            
            # Calculate balance for this group
            # Positive balance means user is owed money
            # Negative balance means user owes money
            
            # Get total expenses created by user in this group
            from app.models.expense import Expense
            from app.models.expense_share import ExpenseShare
            
            total_expenses_created = db.session.query(db.func.sum(Expense.amount)).filter_by(
                group_id=group.id, created_by=user_id
            ).scalar() or 0
            
            # Get total shares owed by user in this group
            total_shares_owed = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(
                user_id=user_id, paid=False
            ).join(Expense).filter(Expense.group_id == group.id).scalar() or 0
            
            # Get total shares paid by user in this group
            total_shares_paid = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(
                user_id=user_id, paid=True
            ).join(Expense).filter(Expense.group_id == group.id).scalar() or 0
            
            # Get total payments sent by user in this group
            total_payments_sent = db.session.query(db.func.sum(Payment.amount)).filter_by(
                group_id=group.id, sender_id=user_id, status='completed'
            ).scalar() or 0
            
            # Get total payments received by user in this group
            total_payments_received = db.session.query(db.func.sum(Payment.amount)).filter_by(
                group_id=group.id, recipient_id=user_id, status='completed'
            ).scalar() or 0
            
            # Calculate net balance
            # User's share of expenses they created - what they owe + what they've paid - what they've received
            balance = (total_expenses_created - total_shares_owed) + total_shares_paid + total_payments_received - total_payments_sent
            
            balances.append({
                'group_id': group.id,
                'group_name': group.name,
                'balance': float(balance),
                'total_expenses_created': float(total_expenses_created),
                'total_shares_owed': float(total_shares_owed),
                'total_shares_paid': float(total_shares_paid),
                'total_payments_sent': float(total_payments_sent),
                'total_payments_received': float(total_payments_received)
            })
        
        return jsonify(balances)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 