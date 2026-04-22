from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.budget import Budget
from app.models.spending_prediction import SpendingPrediction
from app.models.expense import Expense
from app.models.expense_share import ExpenseShare
from app.models.category import Category
from app.models.group import Group
from app.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import func, extract
import json

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

# Budget Management Routes
@analytics_bp.route('/budgets', methods=['POST'])
@jwt_required()
def create_budget():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        name = data.get('name')
        amount = data.get('amount')
        period = data.get('period', 'monthly')
        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
        end_date = None
        if data.get('end_date'):
            end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        group_id = data.get('group_id')
        category_id = data.get('category_id')
        
        if not all([name, amount, start_date]):
            return jsonify({'error': 'Name, amount, and start_date are required'}), 400
        
        # Validate period
        if period not in ['daily', 'weekly', 'monthly', 'yearly']:
            return jsonify({'error': 'Invalid period'}), 400
        
        # Check if group budget already exists for this group and period
        if group_id:
            existing_budget = Budget.query.filter_by(
                group_id=group_id,
                period=period,
                is_active=True
            ).first()
            if existing_budget:
                return jsonify({'error': 'Budget already exists for this group and period'}), 400
        
        budget = Budget(
            user_id=user_id,
            group_id=group_id,
            name=name,
            amount=amount,
            period=period,
            start_date=start_date,
            end_date=end_date,
            category_id=category_id
        )
        
        db.session.add(budget)
        db.session.commit()
        
        return jsonify({
            'message': 'Budget created successfully',
            'budget': budget.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    try:
        user_id = get_jwt_identity()
        group_id = request.args.get('group_id', type=int)
        
        query = Budget.query.filter_by(user_id=user_id, is_active=True)
        
        if group_id:
            query = query.filter_by(group_id=group_id)
        
        budgets = query.all()
        
        result = []
        for budget in budgets:
            budget_data = budget.to_dict()
            budget_data['spent_amount'] = budget.get_spent_amount()
            budget_data['remaining_amount'] = budget.get_remaining_amount()
            budget_data['usage_percentage'] = budget.get_usage_percentage()
            
            if budget.group_id:
                group = Group.query.get(budget.group_id)
                budget_data['group_name'] = group.name if group else 'Unknown Group'
            
            if budget.category_id:
                category = Category.query.get(budget.category_id)
                budget_data['category_name'] = category.name if category else 'Unknown Category'
            
            result.append(budget_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/budgets/<int:budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        # Update fields
        if 'name' in data:
            budget.name = data['name']
        if 'amount' in data:
            budget.amount = data['amount']
        if 'period' in data:
            if data['period'] not in ['daily', 'weekly', 'monthly', 'yearly']:
                return jsonify({'error': 'Invalid period'}), 400
            budget.period = data['period']
        if 'start_date' in data:
            budget.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data:
            budget.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        if 'is_active' in data:
            budget.is_active = data['is_active']
        
        budget.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Budget updated successfully',
            'budget': budget.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/budgets/<int:budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    try:
        user_id = get_jwt_identity()
        
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        db.session.delete(budget)
        db.session.commit()
        
        return jsonify({'message': 'Budget deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Spending Predictions Routes
@analytics_bp.route('/predictions/generate', methods=['POST'])
@jwt_required()
def generate_predictions():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        prediction_type = data.get('type', 'monthly')  # monthly, category
        
        if prediction_type == 'monthly':
            prediction = SpendingPrediction.generate_monthly_prediction(user_id)
            return jsonify({
                'message': 'Monthly prediction generated',
                'prediction': prediction.to_dict()
            })
        elif prediction_type == 'category':
            category_id = data.get('category_id')
            if not category_id:
                return jsonify({'error': 'Category ID is required for category predictions'}), 400
            
            prediction = SpendingPrediction.generate_category_prediction(user_id, category_id)
            return jsonify({
                'message': 'Category prediction generated',
                'prediction': prediction.to_dict()
            })
        else:
            return jsonify({'error': 'Invalid prediction type'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    try:
        user_id = get_jwt_identity()
        prediction_type = request.args.get('type')
        
        query = SpendingPrediction.query.filter_by(user_id=user_id)
        
        if prediction_type:
            query = query.filter_by(prediction_type=prediction_type)
        
        predictions = query.order_by(SpendingPrediction.created_at.desc()).all()
        
        result = []
        for prediction in predictions:
            prediction_data = prediction.to_dict()
            
            if prediction.category_id:
                category = Category.query.get(prediction.category_id)
                prediction_data['category_name'] = category.name if category else 'Unknown Category'
            
            if prediction.group_id:
                group = Group.query.get(prediction.group_id)
                prediction_data['group_name'] = group.name if group else 'Unknown Group'
            
            result.append(prediction_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Advanced Analytics Routes
@analytics_bp.route('/spending-trends', methods=['GET'])
@jwt_required()
def get_spending_trends():
    try:
        user_id = get_jwt_identity()
        months = request.args.get('months', 6, type=int)
        
        # Get spending data for the last N months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30 * months)
        
        # Monthly spending totals
        monthly_data = db.session.query(
            extract('year', Expense.created_at).label('year'),
            extract('month', Expense.created_at).label('month'),
            func.sum(ExpenseShare.amount).label('total_spent')
        ).join(ExpenseShare).filter(
            ExpenseShare.user_id == user_id,
            ExpenseShare.paid == True,
            Expense.created_at >= start_date,
            Expense.created_at <= end_date
        ).group_by(
            extract('year', Expense.created_at),
            extract('month', Expense.created_at)
        ).order_by(
            extract('year', Expense.created_at),
            extract('month', Expense.created_at)
        ).all()
        
        # Category breakdown
        category_data = db.session.query(
            Category.name.label('category'),
            func.sum(ExpenseShare.amount).label('total_spent')
        ).join(Expense).join(ExpenseShare).filter(
            ExpenseShare.user_id == user_id,
            ExpenseShare.paid == True,
            Expense.created_at >= start_date,
            Expense.created_at <= end_date
        ).group_by(Category.name).order_by(
            func.sum(ExpenseShare.amount).desc()
        ).all()
        
        # Group breakdown
        group_data = db.session.query(
            Group.name.label('group'),
            func.sum(ExpenseShare.amount).label('total_spent')
        ).join(Expense).join(ExpenseShare).filter(
            ExpenseShare.user_id == user_id,
            ExpenseShare.paid == True,
            Expense.created_at >= start_date,
            Expense.created_at <= end_date
        ).group_by(Group.name).order_by(
            func.sum(ExpenseShare.amount).desc()
        ).all()
        
        return jsonify({
            'monthly_trends': [
                {
                    'year': int(row.year),
                    'month': int(row.month),
                    'total_spent': float(row.total_spent)
                }
                for row in monthly_data
            ],
            'category_breakdown': [
                {
                    'category': row.category,
                    'total_spent': float(row.total_spent)
                }
                for row in category_data
            ],
            'group_breakdown': [
                {
                    'group': row.group,
                    'total_spent': float(row.total_spent)
                }
                for row in group_data
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/budget-insights', methods=['GET'])
@jwt_required()
def get_budget_insights():
    try:
        user_id = get_jwt_identity()
        
        # Get all active budgets
        budgets = Budget.query.filter_by(user_id=user_id, is_active=True).all()
        
        insights = []
        for budget in budgets:
            spent = budget.get_spent_amount()
            remaining = budget.get_remaining_amount()
            usage_percent = budget.get_usage_percentage()
            
            # Calculate days remaining in budget period
            if budget.end_date:
                days_remaining = (budget.end_date - datetime.now().date()).days
            else:
                # For recurring budgets, calculate based on period
                if budget.period == 'monthly':
                    days_remaining = 30 - datetime.now().day
                elif budget.period == 'weekly':
                    days_remaining = 7 - datetime.now().weekday()
                else:
                    days_remaining = 0
            
            # Generate insights
            insight = {
                'budget_id': budget.id,
                'budget_name': budget.name,
                'budget_amount': budget.amount,
                'spent_amount': spent,
                'remaining_amount': remaining,
                'usage_percentage': usage_percent,
                'days_remaining': max(0, days_remaining),
                'insights': []
            }
            
            # Add insights based on spending patterns
            if usage_percent > 80:
                insight['insights'].append('Budget nearly exhausted - consider reducing spending')
            elif usage_percent > 60:
                insight['insights'].append('Budget usage is high - monitor spending closely')
            elif usage_percent < 30 and days_remaining < 7:
                insight['insights'].append('Budget underutilized - good spending control')
            
            if days_remaining > 0:
                daily_budget = remaining / days_remaining
                insight['daily_budget'] = daily_budget
                insight['insights'].append(f'Daily budget remaining: ${daily_budget:.2f}')
            
            insights.append(insight)
        
        return jsonify(insights)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 