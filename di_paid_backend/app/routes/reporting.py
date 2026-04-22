from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.expense import Expense
from app.models.payment import Payment
from app.models.group import Group
from app.models.user import User
from app.models.group_member import GroupMember
from app.models.expense_share import ExpenseShare
from sqlalchemy import func, extract
from app.models.category import Category
from datetime import datetime, timedelta
import csv
import io
import json

reporting_bp = Blueprint('reporting', __name__, url_prefix='/api/reports')

@reporting_bp.route('/user-summary', methods=['GET'])
@jwt_required()
def user_summary():
    user_id = get_jwt_identity()
    total_expenses = Expense.query.filter_by(created_by=user_id).with_entities(func.sum(Expense.amount)).scalar() or 0
    total_owed = ExpenseShare.query.filter_by(user_id=user_id, paid=False).with_entities(func.sum(ExpenseShare.amount)).scalar() or 0
    total_paid = ExpenseShare.query.filter_by(user_id=user_id, paid=True).with_entities(func.sum(ExpenseShare.amount)).scalar() or 0
    return jsonify({
        'total_expenses': total_expenses,
        'total_owed': total_owed,
        'total_paid': total_paid
    })

@reporting_bp.route('/group-summary/<int:group_id>', methods=['GET'])
@jwt_required()
def group_summary(group_id):
    group = Group.query.get_or_404(group_id)
    expenses = Expense.query.filter_by(group_id=group_id).all()
    total = sum(e.amount for e in expenses)
    return jsonify({
        'group_id': group_id,
        'group_name': group.name,
        'total_expenses': total,
        'num_expenses': len(expenses)
    })

@reporting_bp.route('/group-balances/<int:group_id>', methods=['GET'])
@jwt_required()
def group_balances(group_id):
    # Calculate net balances for all group members
    group = Group.query.get_or_404(group_id)
    members = [m.user for m in group.members]
    balances = {u.id: 0 for u in members}
    # For each expense in group, update balances
    for expense in Expense.query.filter_by(group_id=group_id):
        shares = expense.shares
        for share in shares:
            balances[share.user_id] -= share.amount
        balances[expense.created_by] += expense.amount
    # Format result
    result = []
    for user_id, balance in balances.items():
        result.append({'user_id': user_id, 'username': User.query.get(user_id).username, 'balance': balance})
    return jsonify(result)

@reporting_bp.route('/category-summary', methods=['GET'])
@jwt_required()
def category_summary():
    user_id = get_jwt_identity()
    # Sum expenses by category for this user
    data = db.session.query(Category.name, func.sum(Expense.amount)) \
        .join(Expense, Expense.category_id == Category.id) \
        .filter(Expense.created_by == user_id) \
        .group_by(Category.name).all()
    return jsonify([{ 'category': name, 'total': total } for name, total in data])

@reporting_bp.route('/monthly-summary', methods=['GET'])
@jwt_required()
def monthly_summary():
    user_id = get_jwt_identity()
    # Sum expenses by month for this user
    data = db.session.query(
        extract('year', Expense.date).label('year'),
        extract('month', Expense.date).label('month'),
        func.sum(Expense.amount)
    ).filter(Expense.created_by == user_id).group_by('year', 'month').all()
    return jsonify([
        { 'year': int(year), 'month': int(month), 'total': float(total) }
        for year, month, total in data
    ])

@reporting_bp.route('/spending-overview', methods=['GET'])
@jwt_required()
def get_spending_overview():
    try:
        user_id = int(get_jwt_identity())
        
        # Get total expenses created by user
        total_spent = db.session.query(db.func.sum(Expense.amount)).filter_by(created_by=user_id).scalar() or 0
        
        # Get total payments sent by user
        total_payments_sent = db.session.query(db.func.sum(Payment.amount)).filter_by(sender_id=user_id, status='completed').scalar() or 0
        
        # Get total payments received by user
        total_payments_received = db.session.query(db.func.sum(Payment.amount)).filter_by(recipient_id=user_id, status='completed').scalar() or 0
        
        # Get total shares owed by user
        total_shares_owed = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(user_id=user_id, paid=False).scalar() or 0
        
        # Get total shares paid by user
        total_shares_paid = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(user_id=user_id, paid=True).scalar() or 0
        
        # Calculate net balance
        net_balance = (total_spent - total_shares_owed) + total_shares_paid + total_payments_received - total_payments_sent
        
        # Get active groups count
        active_groups = GroupMember.query.filter_by(user_id=user_id).count()
        
        return jsonify({
            'total_spent': float(total_spent),
            'total_paid': float(total_shares_paid),  # Frontend expects total_paid
            'outstanding_balance': float(total_shares_owed),  # Frontend expects outstanding_balance
            'active_groups': active_groups,  # Frontend expects active_groups
            'total_payments_sent': float(total_payments_sent),
            'total_payments_received': float(total_payments_received),
            'net_balance': float(net_balance)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reporting_bp.route('/monthly-trends', methods=['GET'])
@jwt_required()
def get_monthly_trends():
    try:
        user_id = int(get_jwt_identity())
        months = request.args.get('months', 6, type=int)
        
        trends = []
        for i in range(months):
            date = datetime.now() - timedelta(days=30*i)
            start_date = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i == 0:
                end_date = datetime.now()
            else:
                end_date = start_date + timedelta(days=32)
                end_date = end_date.replace(day=1) - timedelta(seconds=1)
            
            # Get expenses for this month
            monthly_expenses = db.session.query(db.func.sum(Expense.amount)).filter(
                Expense.created_by == user_id,
                Expense.created_at >= start_date,
                Expense.created_at <= end_date
            ).scalar() or 0
            
            # Get payments for this month
            monthly_payments_sent = db.session.query(db.func.sum(Payment.amount)).filter(
                Payment.sender_id == user_id,
                Payment.status == 'completed',
                Payment.created_at >= start_date,
                Payment.created_at <= end_date
            ).scalar() or 0
            
            monthly_payments_received = db.session.query(db.func.sum(Payment.amount)).filter(
                Payment.recipient_id == user_id,
                Payment.status == 'completed',
                Payment.created_at >= start_date,
                Payment.created_at <= end_date
            ).scalar() or 0
            
            total_monthly = float(monthly_expenses + monthly_payments_sent - monthly_payments_received)
            
            trends.append({
                'label': start_date.strftime('%b %Y'),  # Frontend expects 'label'
                'value': total_monthly,  # Frontend expects 'value'
                'month': start_date.strftime('%b %Y'),
                'amount': total_monthly,
                'expenses': float(monthly_expenses),
                'payments_sent': float(monthly_payments_sent),
                'payments_received': float(monthly_payments_received)
            })
        
        return jsonify(trends[::-1])  # Reverse to show oldest first
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reporting_bp.route('/group-breakdown', methods=['GET'])
@jwt_required()
def get_group_breakdown():
    try:
        user_id = int(get_jwt_identity())
        
        # Get all groups where user is a member
        user_groups = GroupMember.query.filter_by(user_id=user_id).all()
        breakdown = []
        
        for membership in user_groups:
            group = Group.query.get(membership.group_id)
            
            # Get total expenses in this group
            total_spent = db.session.query(db.func.sum(Expense.amount)).filter_by(group_id=group.id).scalar() or 0
            
            # Get user's share in this group
            user_shares = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(
                user_id=user_id
            ).join(Expense).filter(Expense.group_id == group.id).scalar() or 0
            
            # Get user's payments in this group
            payments_sent = db.session.query(db.func.sum(Payment.amount)).filter_by(
                group_id=group.id, sender_id=user_id, status='completed'
            ).scalar() or 0
            
            payments_received = db.session.query(db.func.sum(Payment.amount)).filter_by(
                group_id=group.id, recipient_id=user_id, status='completed'
            ).scalar() or 0
            
            # Calculate balance
            balance = user_shares + payments_received - payments_sent
            
            breakdown.append({
                'label': group.name,  # Frontend expects 'label'
                'value': float(total_spent),  # Frontend expects 'value'
                'group_id': group.id,
                'group_name': group.name,
                'total_spent': float(total_spent),
                'your_share': float(user_shares),
                'payments_sent': float(payments_sent),
                'payments_received': float(payments_received),
                'balance': float(balance)
            })
        
        return jsonify(breakdown)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reporting_bp.route('/payment-history', methods=['GET'])
@jwt_required()
def get_payment_history():
    try:
        user_id = int(get_jwt_identity())
        months = request.args.get('months', 6, type=int)
        
        # Get payments where user is involved
        payments = Payment.query.filter(
            (Payment.sender_id == user_id) | (Payment.recipient_id == user_id)
        ).order_by(Payment.created_at.desc()).limit(50).all()
        
        result = []
        for payment in payments:
            sender = User.query.get(payment.sender_id)
            recipient = User.query.get(payment.recipient_id)
            group = Group.query.get(payment.group_id)
            
            result.append({
                'id': payment.id,
                'type': 'sent' if payment.sender_id == user_id else 'received',
                'amount': float(payment.amount),
                'description': payment.description,
                'payment_method': payment.payment_method,
                'status': payment.status,
                'group_name': group.name if group else 'Unknown Group',
                'created_at': payment.created_at.isoformat() if payment.created_at else None,
                'sender_name': sender.username if sender else 'Unknown',
                'recipient_name': recipient.username if recipient else 'Unknown'
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reporting_bp.route('/expense-categories', methods=['GET'])
@jwt_required()
def get_expense_categories():
    try:
        user_id = int(get_jwt_identity())
        
        # For now, we'll use a simple categorization based on expense titles
        # In a real app, you'd have a category field in the expense model
        expenses = Expense.query.filter_by(created_by=user_id).all()
        
        categories = {}
        for expense in expenses:
            # Simple categorization logic
            title_lower = expense.title.lower()
            if any(word in title_lower for word in ['food', 'restaurant', 'dinner', 'lunch', 'breakfast']):
                category = 'Food & Dining'
            elif any(word in title_lower for word in ['transport', 'uber', 'taxi', 'gas', 'fuel']):
                category = 'Transportation'
            elif any(word in title_lower for word in ['hotel', 'accommodation', 'lodging']):
                category = 'Accommodation'
            elif any(word in title_lower for word in ['entertainment', 'movie', 'concert', 'show']):
                category = 'Entertainment'
            elif any(word in title_lower for word in ['shopping', 'clothes', 'electronics']):
                category = 'Shopping'
            else:
                category = 'Other'
            
            if category not in categories:
                categories[category] = {'total_amount': 0, 'count': 0}
            
            categories[category]['total_amount'] += expense.amount
            categories[category]['count'] += 1
        
        result = [
            {
                'label': category,  # Frontend expects 'label'
                'value': float(data['total_amount']),  # Frontend expects 'value'
                'category': category,
                'total_amount': float(data['total_amount']),
                'count': data['count']
            }
            for category, data in categories.items()
        ]
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reporting_bp.route('/user-activity', methods=['GET'])
@jwt_required()
def get_user_activity():
    try:
        user_id = get_jwt_identity()
        
        # Get active groups count
        active_groups = GroupMember.query.filter_by(user_id=user_id).count()
        
        # Get total expenses created
        total_expenses = Expense.query.filter_by(created_by=user_id).count()
        
        # Get total payments made
        total_payments = Payment.query.filter(
            (Payment.sender_id == user_id) | (Payment.recipient_id == user_id)
        ).count()
        
        # Get recent activity (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_expenses = Expense.query.filter(
            Expense.created_by == user_id,
            Expense.created_at >= thirty_days_ago
        ).count()
        
        recent_payments = Payment.query.filter(
            (Payment.sender_id == user_id) | (Payment.recipient_id == user_id),
            Payment.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'active_groups': active_groups,
            'total_expenses': total_expenses,
            'total_payments': total_payments,
            'recent_expenses': recent_expenses,
            'recent_payments': recent_payments
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reporting_bp.route('/settlement-recommendations', methods=['GET'])
@jwt_required()
def get_settlement_recommendations():
    try:
        user_id = get_jwt_identity()
        
        # Get user's balances across all groups
        user_groups = GroupMember.query.filter_by(user_id=user_id).all()
        recommendations = []
        
        for membership in user_groups:
            group = Group.query.get(membership.group_id)
            
            # Calculate balance for this group
            total_shares_owed = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(
                user_id=user_id, paid=False
            ).join(Expense).filter(Expense.group_id == group.id).scalar() or 0
            
            total_payments_sent = db.session.query(db.func.sum(Payment.amount)).filter_by(
                group_id=group.id, sender_id=user_id, status='completed'
            ).scalar() or 0
            
            total_payments_received = db.session.query(db.func.sum(Payment.amount)).filter_by(
                group_id=group.id, recipient_id=user_id, status='completed'
            ).scalar() or 0
            
            balance = total_shares_owed + total_payments_received - total_payments_sent
            
            if abs(balance) > 10:  # Only recommend if balance is more than $10
                if balance > 0:
                    action = f"Collect ${balance:.2f} from group members"
                    priority = 'high' if balance > 50 else 'medium'
                else:
                    action = f"Pay ${abs(balance):.2f} to settle up"
                    priority = 'high' if abs(balance) > 50 else 'medium'
                
                recommendations.append({
                    'id': f"{group.id}_{user_id}",
                    'group_name': group.name,
                    'action': action,
                    'amount': abs(balance),
                    'priority': priority
                })
        
        # Sort by priority and amount
        recommendations.sort(key=lambda x: (x['priority'] == 'high', x['amount']), reverse=True)
        
        return jsonify(recommendations[:10])  # Return top 10 recommendations
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reporting_bp.route('/export/<report_type>', methods=['GET'])
@jwt_required()
def export_report(report_type):
    try:
        user_id = get_jwt_identity()
        format_type = request.args.get('format', 'json')
        months = request.args.get('months', 6, type=int)
        
        if report_type == 'trends':
            data = get_monthly_trends_data(user_id, months)
        elif report_type == 'groups':
            data = get_group_breakdown_data(user_id)
        elif report_type == 'payments':
            data = get_payment_history_data(user_id, months)
        elif report_type == 'spending':
            # Compose a consolidated spending overview similar to get_spending_overview
            total_spent = db.session.query(db.func.sum(Expense.amount)).filter_by(created_by=user_id).scalar() or 0
            total_payments_sent = db.session.query(db.func.sum(Payment.amount)).filter_by(sender_id=user_id, status='completed').scalar() or 0
            total_payments_received = db.session.query(db.func.sum(Payment.amount)).filter_by(recipient_id=user_id, status='completed').scalar() or 0
            total_shares_owed = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(user_id=user_id, paid=False).scalar() or 0
            total_shares_paid = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(user_id=user_id, paid=True).scalar() or 0
            net_balance = (total_spent - total_shares_owed) + total_shares_paid + total_payments_received - total_payments_sent
            active_groups = GroupMember.query.filter_by(user_id=user_id).count()
            data = [{
                'total_spent': float(total_spent),
                'total_paid': float(total_shares_paid),
                'outstanding_balance': float(total_shares_owed),
                'active_groups': int(active_groups),
                'total_payments_sent': float(total_payments_sent),
                'total_payments_received': float(total_payments_received),
                'net_balance': float(net_balance)
            }]
        else:
            return jsonify({'error': 'Invalid report type'}), 400
        
        if format_type == 'csv':
            # Create CSV
            output = io.StringIO()
            if data:
                writer = csv.DictWriter(output, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
            
            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'{report_type}_report.csv'
            )
        else:
            return jsonify(data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_monthly_trends_data(user_id, months):
    # Implementation similar to get_monthly_trends but returns data for export
    trends = []
    for i in range(months):
        date = datetime.now() - timedelta(days=30*i)
        start_date = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            end_date = datetime.now()
        else:
            end_date = start_date + timedelta(days=32)
            end_date = end_date.replace(day=1) - timedelta(seconds=1)
        
        monthly_expenses = db.session.query(db.func.sum(Expense.amount)).filter(
            Expense.created_by == user_id,
            Expense.created_at >= start_date,
            Expense.created_at <= end_date
        ).scalar() or 0
        
        trends.append({
            'month': start_date.strftime('%B %Y'),
            'expenses': float(monthly_expenses),
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        })
    
    return trends[::-1]

def get_group_breakdown_data(user_id):
    user_groups = GroupMember.query.filter_by(user_id=user_id).all()
    breakdown = []
    
    for membership in user_groups:
        group = Group.query.get(membership.group_id)
        total_spent = db.session.query(db.func.sum(Expense.amount)).filter_by(group_id=group.id).scalar() or 0
        user_shares = db.session.query(db.func.sum(ExpenseShare.amount)).filter_by(
            user_id=user_id
        ).join(Expense).filter(Expense.group_id == group.id).scalar() or 0
        
        breakdown.append({
            'group_name': group.name,
            'total_spent': float(total_spent),
            'your_share': float(user_shares),
            'group_id': group.id
        })
    
    return breakdown

def get_payment_history_data(user_id, months):
    payments = Payment.query.filter(
        (Payment.sender_id == user_id) | (Payment.recipient_id == user_id)
    ).order_by(Payment.created_at.desc()).all()
    
    result = []
    for payment in payments:
        sender = User.query.get(payment.sender_id)
        recipient = User.query.get(payment.recipient_id)
        group = Group.query.get(payment.group_id)
        
        result.append({
            'date': payment.created_at.strftime('%Y-%m-%d') if payment.created_at else '',
            'type': 'sent' if payment.sender_id == user_id else 'received',
            'amount': float(payment.amount),
            'description': payment.description or '',
            'payment_method': payment.payment_method,
            'status': payment.status,
            'group': group.name if group else 'Unknown',
            'sender': sender.username if sender else 'Unknown',
            'recipient': recipient.username if recipient else 'Unknown'
        })
    
    return result 