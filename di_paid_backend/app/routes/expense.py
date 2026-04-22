from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.expense import Expense
from app.models.expense_share import ExpenseShare
from app.models.group import Group
from app.models.user import User
from datetime import datetime
from app.models.notification import Notification
from flask_mail import Message
from app import mail

expense_bp = Blueprint('expense', __name__, url_prefix='/api/expenses')

@expense_bp.route('', methods=['POST'])
@jwt_required()
def create_expense():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        group_id = data.get('group_id')
        title = data.get('title')
        amount = data.get('amount')
        description = data.get('description', '')
        split_type = data.get('split_type', 'equal')
        currency = data.get('currency', 'USD')
        split_data = data.get('split_data', {})  # For percentage and custom splits
        
        if not all([group_id, title, amount]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Verify group exists and user is a member
        group = Group.query.get_or_404(group_id)
        from app.models.group_member import GroupMember
        membership = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
        if not membership:
            return jsonify({'error': 'You are not a member of this group'}), 403
        
        expense = Expense(
            group_id=group_id,
            created_by=user_id,
            title=title,
            amount=amount,
            notes=description,
            currency=currency
        )
        db.session.add(expense)
        db.session.commit()
        
        # Create expense shares based on split type
        group_members = GroupMember.query.filter_by(group_id=group_id).all()
        
        if split_type == 'equal':
            share_amount = amount / len(group_members)
            for member in group_members:
                share = ExpenseShare(
                    expense_id=expense.id,
                    user_id=member.user_id,
                    amount=share_amount,
                    paid=(member.user_id == user_id)  # Creator pays their share immediately
                )
                db.session.add(share)
                
                # Notify other members
                if member.user_id != user_id:
                    notif = Notification(
                        user_id=member.user_id, 
                        message=f'You owe {currency} {share_amount:.2f} for expense "{title}"', 
                        type='expense'
                    )
                    db.session.add(notif)
        
        elif split_type == 'percentage':
            # split_data should be a dict like {user_id: percentage}
            # Convert string keys to integers for comparison
            split_data_int = {int(k): v for k, v in split_data.items()}
            total_percentage = sum(split_data_int.values())
            if abs(total_percentage - 100) > 0.01:  # Allow small floating point errors
                return jsonify({'error': 'Percentages must sum to 100'}), 400
            
            for member in group_members:
                if member.user_id in split_data_int:
                    percentage = split_data_int[member.user_id]
                    share_amount = (amount * percentage) / 100
                    share = ExpenseShare(
                        expense_id=expense.id,
                        user_id=member.user_id,
                        amount=share_amount,
                        paid=(member.user_id == user_id)
                    )
                    db.session.add(share)
                    
                    # Notify other members
                    if member.user_id != user_id:
                        notif = Notification(
                            user_id=member.user_id, 
                            message=f'You owe {currency} {share_amount:.2f} ({percentage}%) for expense "{title}"', 
                            type='expense'
                        )
                        db.session.add(notif)
                else:
                    return jsonify({'error': f'Percentage not specified for user {member.user_id}'}), 400
        
        elif split_type == 'custom':
            # split_data should be a dict like {user_id: amount}
            # Convert string keys to integers for comparison
            split_data_int = {int(k): v for k, v in split_data.items()}
            total_custom_amount = sum(split_data_int.values())
            if abs(total_custom_amount - amount) > 0.01:  # Allow small floating point errors
                return jsonify({'error': f'Custom amounts must sum to {amount}'}), 400
            
            for member in group_members:
                if member.user_id in split_data_int:
                    share_amount = split_data_int[member.user_id]
                    share = ExpenseShare(
                        expense_id=expense.id,
                        user_id=member.user_id,
                        amount=share_amount,
                        paid=(member.user_id == user_id)
                    )
                    db.session.add(share)
                    
                    # Notify other members
                    if member.user_id != user_id:
                        notif = Notification(
                            user_id=member.user_id, 
                            message=f'You owe {currency} {share_amount:.2f} for expense "{title}"', 
                            type='expense'
                        )
                        db.session.add(notif)
                else:
                    return jsonify({'error': f'Amount not specified for user {member.user_id}'}), 400
        
        else:
            return jsonify({'error': 'Invalid split type'}), 400
        
        db.session.commit()
        
        return jsonify({
            'id': expense.id, 
            'title': expense.title, 
            'amount': expense.amount,
            'currency': expense.currency,
            'description': expense.notes,
            'group_id': expense.group_id,
            'created_by': expense.created_by,
            'created_at': expense.created_at.isoformat() if expense.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expense_bp.route('', methods=['GET'])
@jwt_required()
def list_expenses():
    try:
        user_id = int(get_jwt_identity())
        group_id = request.args.get('group_id', type=int)
        
        if group_id:
            # Get expenses for specific group
            expenses = Expense.query.filter_by(group_id=group_id).all()
        else:
            # Get all expenses where user is involved (either created or has shares)
            from app.models.group_member import GroupMember
            user_groups = GroupMember.query.filter_by(user_id=user_id).all()
            group_ids = [gm.group_id for gm in user_groups]
            expenses = Expense.query.filter(Expense.group_id.in_(group_ids)).all()
        
        result = []
        for expense in expenses:
            # Get group info
            group = Group.query.get(expense.group_id)
            creator = User.query.get(expense.created_by)
            
            # Get shares info
            shares = ExpenseShare.query.filter_by(expense_id=expense.id).all()
            shares_data = []
            for share in shares:
                user = User.query.get(share.user_id)
                shares_data.append({
                    'id': share.id,
                    'user_id': share.user_id,
                    'username': user.username if user else 'Unknown',
                    'amount': share.amount,
                    'paid': share.paid,
                    'paid_at': share.paid_at.isoformat() if share.paid_at else None
                })
            
            result.append({
                'id': expense.id,
                'title': expense.title,
                'amount': expense.amount,
                'currency': expense.currency,
                'description': expense.notes,
                'group_id': expense.group_id,
                'group_name': group.name if group else 'Unknown Group',
                'created_by': expense.created_by,
                'creator_name': creator.username if creator else 'Unknown',
                'created_at': expense.created_at.isoformat() if expense.created_at else None,
                'shares': shares_data
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/<int:expense_id>', methods=['GET'])
@jwt_required()
def get_expense(expense_id):
    try:
        user_id = int(get_jwt_identity())
        expense = Expense.query.get_or_404(expense_id)
        
        # Check if user has access to this expense
        from app.models.group_member import GroupMember
        membership = GroupMember.query.filter_by(group_id=expense.group_id, user_id=user_id).first()
        if not membership:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get group info
        group = Group.query.get(expense.group_id)
        creator = User.query.get(expense.created_by)
        
        # Get shares info
        shares = ExpenseShare.query.filter_by(expense_id=expense.id).all()
        shares_data = []
        for share in shares:
            user = User.query.get(share.user_id)
            shares_data.append({
                'id': share.id,
                'user_id': share.user_id,
                'username': user.username if user else 'Unknown',
                'email': user.email if user else '',
                'amount': share.amount,
                'paid': share.paid,
                'paid_at': share.paid_at.isoformat() if share.paid_at else None
            })
        
        return jsonify({
            'id': expense.id,
            'title': expense.title,
            'amount': expense.amount,
            'currency': expense.currency,
            'description': expense.notes,
            'group_id': expense.group_id,
            'group_name': group.name if group else 'Unknown Group',
            'created_by': expense.created_by,
            'creator_name': creator.username if creator else 'Unknown',
            'created_at': expense.created_at.isoformat() if expense.created_at else None,
            'shares': shares_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    try:
        user_id = int(get_jwt_identity())
        expense = Expense.query.get_or_404(expense_id)
        
        # Only creator can update expense
        if expense.created_by != user_id:
            return jsonify({'error': 'Only the expense creator can update it'}), 403
        
        data = request.get_json()
        if 'title' in data:
            expense.title = data['title']
        if 'amount' in data:
            expense.amount = data['amount']
        if 'description' in data:
            expense.notes = data['description']
        if 'currency' in data:
            expense.currency = data['currency']
        
        db.session.commit()
        return jsonify({'message': 'Expense updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    try:
        user_id = int(get_jwt_identity())
        expense = Expense.query.get_or_404(expense_id)
        
        # Only creator can delete expense
        if expense.created_by != user_id:
            return jsonify({'error': 'Only the expense creator can delete it'}), 403
        
        # Delete associated shares first
        ExpenseShare.query.filter_by(expense_id=expense_id).delete()
        db.session.delete(expense)
        db.session.commit()
        return jsonify({'message': 'Expense deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/<int:expense_id>/settle', methods=['POST'])
@jwt_required()
def settle_expense(expense_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        share_id = data.get('share_id')
        
        if not share_id:
            return jsonify({'error': 'Share ID is required'}), 400
        
        share = ExpenseShare.query.filter_by(id=share_id, expense_id=expense_id).first_or_404()
        
        # Only the user who owes money can mark it as paid
        if share.user_id != user_id:
            return jsonify({'error': 'You can only mark your own share as paid'}), 403
        
        share.paid = True
        share.paid_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Payment recorded successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_expense_stats():
    try:
        user_id = int(get_jwt_identity())
        
        # Get user's total expenses created
        total_created = db.session.query(db.func.sum(Expense.amount)).filter_by(created_by=user_id).scalar() or 0
        
        # Get user's total shares owed
        total_owed = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(user_id=user_id, paid=False).scalar() or 0
        
        # Get user's total shares paid
        total_paid = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(user_id=user_id, paid=True).scalar() or 0
        
        return jsonify({
            'total_created': float(total_created),
            'total_owed': float(total_owed),
            'total_paid': float(total_paid),
            'net_balance': float(total_created - total_owed)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 