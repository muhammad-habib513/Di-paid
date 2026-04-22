import pytest
from app import create_app, db
from app.models.user import User
from app.models.group import Group
from app.models.expense import Expense
from app.models.payment import Payment
from app.models.category import Category
from app.models.group_member import GroupMember
from app.models.expense_share import ExpenseShare
from app.models.friendship import Friendship
from app.models.activity import Activity
from app.models.budget import Budget
from app.models.spending_prediction import SpendingPrediction
from app.models.notification import Notification
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import os

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary database for testing
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-secret-key',
        'SECRET_KEY': 'test-secret-key'
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def test_user(app):
    """Create a test user."""
    user = User(
        username='testuser',
        email='test@example.com',
        password_hash=generate_password_hash('password123')
    )
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_user2(app):
    """Create a second test user."""
    user = User(
        username='testuser2',
        email='test2@example.com',
        password_hash=generate_password_hash('password123')
    )
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_category(app):
    """Create a test category."""
    category = Category(name='Food', description='Food and dining expenses')
    db.session.add(category)
    db.session.commit()
    return category

@pytest.fixture
def test_group(app, test_user):
    """Create a test group."""
    group = Group(
        name='Test Group',
        description='A test group for expenses',
        created_by=test_user.id
    )
    db.session.add(group)
    db.session.commit()
    
    # Add user as member
    member = GroupMember(
        group_id=group.id,
        user_id=test_user.id,
        role='admin'
    )
    db.session.add(member)
    db.session.commit()
    
    return group

@pytest.fixture
def test_expense(app, test_user, test_group, test_category):
    """Create a test expense."""
    expense = Expense(
        group_id=test_group.id,
        created_by=test_user.id,
        title='Test Expense',
        amount=100.0,
        notes='A test expense',
        category_id=test_category.id
    )
    db.session.add(expense)
    db.session.commit()
    
    # Create expense share for the user
    share = ExpenseShare(
        expense_id=expense.id,
        user_id=test_user.id,
        amount=100.0,
        paid=True
    )
    db.session.add(share)
    db.session.commit()
    
    return expense

@pytest.fixture
def test_payment(app, test_user, test_user2, test_group):
    """Create a test payment."""
    payment = Payment(
        group_id=test_group.id,
        sender_id=test_user.id,
        recipient_id=test_user2.id,
        amount=50.0,
        description='Test payment',
        payment_method='cash',
        status='completed'
    )
    db.session.add(payment)
    db.session.commit()
    return payment

@pytest.fixture
def test_budget(app, test_user, test_group, test_category):
    """Create a test budget."""
    budget = Budget(
        user_id=test_user.id,
        group_id=test_group.id,
        name='Test Budget',
        amount=500.0,
        period='monthly',
        start_date=datetime.now().date(),
        category_id=test_category.id
    )
    db.session.add(budget)
    db.session.commit()
    return budget

@pytest.fixture
def test_friendship(app, test_user, test_user2):
    """Create a test friendship."""
    friendship = Friendship(
        requester_id=test_user.id,
        addressee_id=test_user2.id,
        status='accepted'
    )
    db.session.add(friendship)
    db.session.commit()
    return friendship

@pytest.fixture
def test_activity(app, test_user, test_group):
    """Create a test activity."""
    activity = Activity(
        user_id=test_user.id,
        activity_type='expense_created',
        title='Created an expense',
        description='User created a new expense',
        resource_type='expense',
        resource_id=1,
        group_id=test_group.id,
        is_public=True
    )
    db.session.add(activity)
    db.session.commit()
    return activity

@pytest.fixture
def test_notification(app, test_user):
    """Create a test notification."""
    notification = Notification(
        user_id=test_user.id,
        message='Test notification',
        type='expense',
        is_read=False
    )
    db.session.add(notification)
    db.session.commit()
    return notification

@pytest.fixture
def auth_headers(test_user, client):
    """Get authentication headers for a test user."""
    # Login to get token
    response = client.post('/api/auth/login', json={
        'username': test_user.username,
        'password': 'password123'
    })
    token = response.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def auth_headers_user2(test_user2, client):
    """Get authentication headers for the second test user."""
    response = client.post('/api/auth/login', json={
        'username': test_user2.username,
        'password': 'password123'
    })
    token = response.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'} 