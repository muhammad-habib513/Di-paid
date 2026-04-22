from flask_restx import Api, Resource, Namespace, fields
from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.group import Group
from app.models.expense import Expense
from app.models.payment import Payment
from app.models.friendship import Friendship
from app.models.activity import Activity
from app.models.budget import Budget
from app.models.spending_prediction import SpendingPrediction
from app.models.notification import Notification
from app.models.category import Category
from app.models.group_member import GroupMember
from app.models.expense_share import ExpenseShare
from datetime import datetime
import json

# Create API instance
api_docs_bp = Blueprint('api_docs', __name__, url_prefix='/api-docs')
api = Api(api_docs_bp, 
    title='Di-Paid API',
    version='1.0',
    description='A comprehensive API for Di-Paid - Group Expense Management and Bill Splitting Platform',
    doc='/docs',
    authorizations={
        'apikey': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': "Type 'Bearer <JWT>' where JWT is the token"
        }
    },
    security='apikey'
)

# Create namespaces
auth_ns = Namespace('auth', description='Authentication operations')
user_ns = Namespace('users', description='User operations')
group_ns = Namespace('groups', description='Group operations')
expense_ns = Namespace('expenses', description='Expense operations')
payment_ns = Namespace('payments', description='Payment operations')
notification_ns = Namespace('notifications', description='Notification operations')
chat_ns = Namespace('chat', description='Chat operations')
report_ns = Namespace('reports', description='Reporting operations')
security_ns = Namespace('security', description='Security operations')
social_ns = Namespace('social', description='Social features operations')
analytics_ns = Namespace('analytics', description='Analytics operations')

# Add namespaces to API
api.add_namespace(auth_ns)
api.add_namespace(user_ns)
api.add_namespace(group_ns)
api.add_namespace(expense_ns)
api.add_namespace(payment_ns)
api.add_namespace(notification_ns)
api.add_namespace(chat_ns)
api.add_namespace(report_ns)
api.add_namespace(security_ns)
api.add_namespace(social_ns)
api.add_namespace(analytics_ns)

# Define models for request/response documentation
user_model = api.model('User', {
    'id': fields.Integer(readonly=True, description='User ID'),
    'username': fields.String(required=True, description='Username'),
    'email': fields.String(required=True, description='Email address'),
    'created_at': fields.DateTime(readonly=True, description='Account creation date')
})

user_register_model = api.model('UserRegister', {
    'username': fields.String(required=True, description='Username'),
    'email': fields.String(required=True, description='Email address'),
    'password': fields.String(required=True, description='Password')
})

user_login_model = api.model('UserLogin', {
    'username': fields.String(required=True, description='Username or email'),
    'password': fields.String(required=True, description='Password')
})

group_model = api.model('Group', {
    'id': fields.Integer(readonly=True, description='Group ID'),
    'name': fields.String(required=True, description='Group name'),
    'description': fields.String(description='Group description'),
    'created_by': fields.Integer(readonly=True, description='Creator user ID'),
    'created_at': fields.DateTime(readonly=True, description='Group creation date')
})

expense_model = api.model('Expense', {
    'id': fields.Integer(readonly=True, description='Expense ID'),
    'group_id': fields.Integer(required=True, description='Group ID'),
    'title': fields.String(required=True, description='Expense title'),
    'amount': fields.Float(required=True, description='Expense amount'),
    'description': fields.String(description='Expense description'),
    'category_id': fields.Integer(description='Category ID'),
    'created_by': fields.Integer(readonly=True, description='Creator user ID'),
    'created_at': fields.DateTime(readonly=True, description='Expense creation date')
})

payment_model = api.model('Payment', {
    'id': fields.Integer(readonly=True, description='Payment ID'),
    'group_id': fields.Integer(required=True, description='Group ID'),
    'sender_id': fields.Integer(readonly=True, description='Sender user ID'),
    'recipient_id': fields.Integer(required=True, description='Recipient user ID'),
    'amount': fields.Float(required=True, description='Payment amount'),
    'description': fields.String(description='Payment description'),
    'payment_method': fields.String(description='Payment method'),
    'status': fields.String(description='Payment status'),
    'created_at': fields.DateTime(readonly=True, description='Payment creation date')
})

budget_model = api.model('Budget', {
    'id': fields.Integer(readonly=True, description='Budget ID'),
    'name': fields.String(required=True, description='Budget name'),
    'amount': fields.Float(required=True, description='Budget amount'),
    'period': fields.String(description='Budget period (daily, weekly, monthly, yearly)'),
    'start_date': fields.Date(required=True, description='Budget start date'),
    'end_date': fields.Date(description='Budget end date'),
    'group_id': fields.Integer(description='Group ID for group budgets'),
    'category_id': fields.Integer(description='Category ID for category budgets'),
    'is_active': fields.Boolean(description='Budget active status')
})

friendship_model = api.model('Friendship', {
    'id': fields.Integer(readonly=True, description='Friendship ID'),
    'requester_id': fields.Integer(readonly=True, description='Requester user ID'),
    'addressee_id': fields.Integer(required=True, description='Addressee user ID'),
    'status': fields.String(description='Friendship status (pending, accepted, rejected)'),
    'created_at': fields.DateTime(readonly=True, description='Friendship creation date')
})

activity_model = api.model('Activity', {
    'id': fields.Integer(readonly=True, description='Activity ID'),
    'user_id': fields.Integer(readonly=True, description='User ID'),
    'activity_type': fields.String(description='Activity type'),
    'title': fields.String(description='Activity title'),
    'description': fields.String(description='Activity description'),
    'resource_type': fields.String(description='Resource type'),
    'resource_id': fields.Integer(description='Resource ID'),
    'group_id': fields.Integer(description='Group ID'),
    'is_public': fields.Boolean(description='Public activity flag'),
    'created_at': fields.DateTime(readonly=True, description='Activity creation date')
})

notification_model = api.model('Notification', {
    'id': fields.Integer(readonly=True, description='Notification ID'),
    'user_id': fields.Integer(readonly=True, description='User ID'),
    'message': fields.String(description='Notification message'),
    'type': fields.String(description='Notification type'),
    'is_read': fields.Boolean(description='Read status'),
    'created_at': fields.DateTime(readonly=True, description='Notification creation date')
})

# Authentication endpoints
@auth_ns.route('/register')
class UserRegistration(Resource):
    @auth_ns.expect(user_register_model)
    @auth_ns.response(201, 'User created successfully')
    @auth_ns.response(400, 'Validation error')
    def post(self):
        """Register a new user"""
        pass

@auth_ns.route('/login')
class UserLogin(Resource):
    @auth_ns.expect(user_login_model)
    @auth_ns.response(200, 'Login successful')
    @auth_ns.response(401, 'Invalid credentials')
    def post(self):
        """Login user and return JWT token"""
        pass

# User endpoints
@user_ns.route('/profile')
class UserProfile(Resource):
    @user_ns.doc(security='apikey')
    @user_ns.response(200, 'Success', user_model)
    @user_ns.response(401, 'Unauthorized')
    def get(self):
        """Get current user profile"""
        pass

    @user_ns.doc(security='apikey')
    @user_ns.expect(user_model)
    @user_ns.response(200, 'Profile updated successfully')
    @user_ns.response(401, 'Unauthorized')
    def put(self):
        """Update current user profile"""
        pass

# Group endpoints
@group_ns.route('')
class GroupList(Resource):
    @group_ns.doc(security='apikey')
    @group_ns.response(200, 'Success', [group_model])
    @group_ns.response(401, 'Unauthorized')
    def get(self):
        """Get all groups for current user"""
        pass

    @group_ns.doc(security='apikey')
    @group_ns.expect(group_model)
    @group_ns.response(201, 'Group created successfully', group_model)
    @group_ns.response(401, 'Unauthorized')
    def post(self):
        """Create a new group"""
        pass

@group_ns.route('/<int:group_id>')
class GroupDetail(Resource):
    @group_ns.doc(security='apikey')
    @group_ns.response(200, 'Success', group_model)
    @group_ns.response(401, 'Unauthorized')
    @group_ns.response(404, 'Group not found')
    def get(self, group_id):
        """Get group details"""
        pass

    @group_ns.doc(security='apikey')
    @group_ns.expect(group_model)
    @group_ns.response(200, 'Group updated successfully')
    @group_ns.response(401, 'Unauthorized')
    @group_ns.response(404, 'Group not found')
    def put(self, group_id):
        """Update group details"""
        pass

    @group_ns.doc(security='apikey')
    @group_ns.response(200, 'Group deleted successfully')
    @group_ns.response(401, 'Unauthorized')
    @group_ns.response(404, 'Group not found')
    def delete(self, group_id):
        """Delete group"""
        pass

# Expense endpoints
@expense_ns.route('')
class ExpenseList(Resource):
    @expense_ns.doc(security='apikey')
    @expense_ns.response(200, 'Success', [expense_model])
    @expense_ns.response(401, 'Unauthorized')
    def get(self):
        """Get all expenses for current user"""
        pass

    @expense_ns.doc(security='apikey')
    @expense_ns.expect(expense_model)
    @expense_ns.response(201, 'Expense created successfully', expense_model)
    @expense_ns.response(401, 'Unauthorized')
    def post(self):
        """Create a new expense"""
        pass

@expense_ns.route('/<int:expense_id>')
class ExpenseDetail(Resource):
    @expense_ns.doc(security='apikey')
    @expense_ns.response(200, 'Success', expense_model)
    @expense_ns.response(401, 'Unauthorized')
    @expense_ns.response(404, 'Expense not found')
    def get(self, expense_id):
        """Get expense details"""
        pass

    @expense_ns.doc(security='apikey')
    @expense_ns.expect(expense_model)
    @expense_ns.response(200, 'Expense updated successfully')
    @expense_ns.response(401, 'Unauthorized')
    @expense_ns.response(404, 'Expense not found')
    def put(self, expense_id):
        """Update expense details"""
        pass

    @expense_ns.doc(security='apikey')
    @expense_ns.response(200, 'Expense deleted successfully')
    @expense_ns.response(401, 'Unauthorized')
    @expense_ns.response(404, 'Expense not found')
    def delete(self, expense_id):
        """Delete expense"""
        pass

# Payment endpoints
@payment_ns.route('')
class PaymentList(Resource):
    @payment_ns.doc(security='apikey')
    @payment_ns.response(200, 'Success', [payment_model])
    @payment_ns.response(401, 'Unauthorized')
    def get(self):
        """Get all payments for current user"""
        pass

    @payment_ns.doc(security='apikey')
    @payment_ns.expect(payment_model)
    @payment_ns.response(201, 'Payment created successfully', payment_model)
    @payment_ns.response(401, 'Unauthorized')
    def post(self):
        """Create a new payment"""
        pass

@payment_ns.route('/<int:payment_id>')
class PaymentDetail(Resource):
    @payment_ns.doc(security='apikey')
    @payment_ns.response(200, 'Success', payment_model)
    @payment_ns.response(401, 'Unauthorized')
    @payment_ns.response(404, 'Payment not found')
    def get(self, payment_id):
        """Get payment details"""
        pass

    @payment_ns.doc(security='apikey')
    @payment_ns.expect(payment_model)
    @payment_ns.response(200, 'Payment updated successfully')
    @payment_ns.response(401, 'Unauthorized')
    @payment_ns.response(404, 'Payment not found')
    def put(self, payment_id):
        """Update payment details"""
        pass

# Budget endpoints
@analytics_ns.route('/budgets')
class BudgetList(Resource):
    @analytics_ns.doc(security='apikey')
    @analytics_ns.response(200, 'Success', [budget_model])
    @analytics_ns.response(401, 'Unauthorized')
    def get(self):
        """Get all budgets for current user"""
        pass

    @analytics_ns.doc(security='apikey')
    @analytics_ns.expect(budget_model)
    @analytics_ns.response(201, 'Budget created successfully', budget_model)
    @analytics_ns.response(401, 'Unauthorized')
    def post(self):
        """Create a new budget"""
        pass

@analytics_ns.route('/budgets/<int:budget_id>')
class BudgetDetail(Resource):
    @analytics_ns.doc(security='apikey')
    @analytics_ns.response(200, 'Success', budget_model)
    @analytics_ns.response(401, 'Unauthorized')
    @analytics_ns.response(404, 'Budget not found')
    def get(self, budget_id):
        """Get budget details"""
        pass

    @analytics_ns.doc(security='apikey')
    @analytics_ns.expect(budget_model)
    @analytics_ns.response(200, 'Budget updated successfully')
    @analytics_ns.response(401, 'Unauthorized')
    @analytics_ns.response(404, 'Budget not found')
    def put(self, budget_id):
        """Update budget details"""
        pass

    @analytics_ns.doc(security='apikey')
    @analytics_ns.response(200, 'Budget deleted successfully')
    @analytics_ns.response(401, 'Unauthorized')
    @analytics_ns.response(404, 'Budget not found')
    def delete(self, budget_id):
        """Delete budget"""
        pass

# Social endpoints
@social_ns.route('/friends')
class FriendList(Resource):
    @social_ns.doc(security='apikey')
    @social_ns.response(200, 'Success', [user_model])
    @social_ns.response(401, 'Unauthorized')
    def get(self):
        """Get all friends for current user"""
        pass

@social_ns.route('/friends/request')
class FriendRequest(Resource):
    @social_ns.doc(security='apikey')
    @social_ns.expect(friendship_model)
    @social_ns.response(201, 'Friend request sent successfully')
    @social_ns.response(401, 'Unauthorized')
    def post(self):
        """Send friend request"""
        pass

@social_ns.route('/friends/requests')
class FriendRequestList(Resource):
    @social_ns.doc(security='apikey')
    @social_ns.response(200, 'Success')
    @social_ns.response(401, 'Unauthorized')
    def get(self):
        """Get pending friend requests"""
        pass

@social_ns.route('/activity-feed')
class ActivityFeed(Resource):
    @social_ns.doc(security='apikey')
    @social_ns.response(200, 'Success', [activity_model])
    @social_ns.response(401, 'Unauthorized')
    def get(self):
        """Get activity feed for current user"""
        pass

# Reporting endpoints
@report_ns.route('/overview')
class SpendingOverview(Resource):
    @report_ns.doc(security='apikey')
    def get(self):
        """Get spending overview"""
        pass 