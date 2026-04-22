from app import db
from datetime import datetime, timedelta
import json

class SpendingPrediction(db.Model):
    __tablename__ = 'spending_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)
    prediction_type = db.Column(db.String(50), nullable=False)  # monthly, weekly, category, etc.
    predicted_amount = db.Column(db.Float, nullable=False)
    confidence_score = db.Column(db.Float, default=0.0)  # 0-1 confidence in prediction
    prediction_date = db.Column(db.Date, nullable=False)  # Date for which prediction is made
    factors = db.Column(db.Text)  # JSON string with factors used for prediction
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='spending_predictions')
    category = db.relationship('Category', backref='spending_predictions')
    group = db.relationship('Group', backref='spending_predictions')
    
    def __repr__(self):
        return f'<SpendingPrediction {self.prediction_type}: ${self.predicted_amount}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'group_id': self.group_id,
            'prediction_type': self.prediction_type,
            'predicted_amount': self.predicted_amount,
            'confidence_score': self.confidence_score,
            'prediction_date': self.prediction_date.isoformat() if self.prediction_date else None,
            'factors': self.factors,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def generate_monthly_prediction(cls, user_id, target_month=None):
        """Generate monthly spending prediction based on historical data"""
        from app.models.expense import Expense
        from app.models.expense_share import ExpenseShare
        
        if not target_month:
            target_month = datetime.now().replace(day=1)
        
        # Get historical data (last 6 months)
        six_months_ago = target_month - timedelta(days=180)
        
        # Calculate average monthly spending
        monthly_totals = []
        for i in range(6):
            month_start = six_months_ago + timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            # Get user's expense shares for this month
            shares = ExpenseShare.query.filter(
                ExpenseShare.user_id == user_id,
                ExpenseShare.paid == True
            ).join(Expense).filter(
                Expense.created_at >= month_start,
                Expense.created_at < month_end
            )
            
            monthly_total = shares.with_entities(db.func.sum(ExpenseShare.amount)).scalar() or 0
            monthly_totals.append(monthly_total)
        
        # Calculate prediction (simple average for now)
        if monthly_totals:
            predicted_amount = sum(monthly_totals) / len(monthly_totals)
            confidence_score = min(0.9, len([t for t in monthly_totals if t > 0]) / 6)
        else:
            predicted_amount = 0
            confidence_score = 0
        
        # Create prediction record
        prediction = cls(
            user_id=user_id,
            prediction_type='monthly',
            predicted_amount=predicted_amount,
            confidence_score=confidence_score,
            prediction_date=target_month,
            factors=json.dumps({
                'historical_months': len(monthly_totals),
                'average_spending': predicted_amount,
                'data_points': monthly_totals
            })
        )
        
        db.session.add(prediction)
        db.session.commit()
        return prediction
    
    @classmethod
    def generate_category_prediction(cls, user_id, category_id, target_month=None):
        """Generate category-specific spending prediction"""
        from app.models.expense import Expense
        from app.models.expense_share import ExpenseShare
        
        if not target_month:
            target_month = datetime.now().replace(day=1)
        
        # Get historical data for this category (last 3 months)
        three_months_ago = target_month - timedelta(days=90)
        
        monthly_totals = []
        for i in range(3):
            month_start = three_months_ago + timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            shares = ExpenseShare.query.filter(
                ExpenseShare.user_id == user_id,
                ExpenseShare.paid == True
            ).join(Expense).filter(
                Expense.category_id == category_id,
                Expense.created_at >= month_start,
                Expense.created_at < month_end
            )
            
            monthly_total = shares.with_entities(db.func.sum(ExpenseShare.amount)).scalar() or 0
            monthly_totals.append(monthly_total)
        
        if monthly_totals:
            predicted_amount = sum(monthly_totals) / len(monthly_totals)
            confidence_score = min(0.8, len([t for t in monthly_totals if t > 0]) / 3)
        else:
            predicted_amount = 0
            confidence_score = 0
        
        prediction = cls(
            user_id=user_id,
            category_id=category_id,
            prediction_type='category',
            predicted_amount=predicted_amount,
            confidence_score=confidence_score,
            prediction_date=target_month,
            factors=json.dumps({
                'category_id': category_id,
                'historical_months': len(monthly_totals),
                'average_spending': predicted_amount,
                'data_points': monthly_totals
            })
        )
        
        db.session.add(prediction)
        db.session.commit()
        return prediction 