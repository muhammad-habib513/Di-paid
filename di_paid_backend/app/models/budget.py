from app import db
from datetime import datetime

class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)  # Null for personal budgets
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), default='monthly')  # daily, weekly, monthly, yearly
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)  # Null for recurring budgets
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)  # Null for general budgets
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='budgets')
    group = db.relationship('Group', backref='budgets')
    category = db.relationship('Category', backref='budgets')
    
    def __repr__(self):
        return f'<Budget {self.name}: ${self.amount} ({self.period})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'group_id': self.group_id,
            'name': self.name,
            'amount': self.amount,
            'period': self.period,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'category_id': self.category_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_spent_amount(self):
        """Calculate how much has been spent against this budget"""
        from app.models.expense import Expense
        from app.models.expense_share import ExpenseShare
        
        if self.group_id:
            # Group budget - sum of expenses in the group
            expenses = Expense.query.filter(
                Expense.group_id == self.group_id,
                Expense.created_at >= self.start_date
            )
            if self.end_date:
                expenses = expenses.filter(Expense.created_at <= self.end_date)
            
            if self.category_id:
                expenses = expenses.filter(Expense.category_id == self.category_id)
            
            return expenses.with_entities(db.func.sum(Expense.amount)).scalar() or 0
        else:
            # Personal budget - sum of user's expense shares
            shares = ExpenseShare.query.filter(
                ExpenseShare.user_id == self.user_id,
                ExpenseShare.paid == True
            ).join(Expense).filter(
                Expense.created_at >= self.start_date
            )
            
            if self.end_date:
                shares = shares.filter(Expense.created_at <= self.end_date)
            
            if self.category_id:
                shares = shares.filter(Expense.category_id == self.category_id)
            
            return shares.with_entities(db.func.sum(ExpenseShare.amount)).scalar() or 0
    
    def get_remaining_amount(self):
        """Calculate remaining budget amount"""
        spent = self.get_spent_amount()
        return max(0, self.amount - spent)
    
    def get_usage_percentage(self):
        """Calculate budget usage percentage"""
        if self.amount == 0:
            return 0
        spent = self.get_spent_amount()
        return min(100, (spent / self.amount) * 100) 