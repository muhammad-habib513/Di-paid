import pytest
from app import db
from app.models.user import User
from werkzeug.security import generate_password_hash

class TestAuth:
    """Test authentication endpoints."""
    
    def test_user_registration_success(self, client):
        """Test successful user registration."""
        response = client.post('/api/auth/register', json={
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'message' in data
        assert 'user' in data
        assert data['user']['username'] == 'newuser'
        assert data['user']['email'] == 'newuser@example.com'
        
        # Verify user was created in database
        user = User.query.filter_by(username='newuser').first()
        assert user is not None
        assert user.email == 'newuser@example.com'
    
    def test_user_registration_duplicate_username(self, client, test_user):
        """Test registration with duplicate username."""
        response = client.post('/api/auth/register', json={
            'username': test_user.username,
            'email': 'different@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'username' in data['error'].lower()
    
    def test_user_registration_duplicate_email(self, client, test_user):
        """Test registration with duplicate email."""
        response = client.post('/api/auth/register', json={
            'username': 'differentuser',
            'email': test_user.email,
            'password': 'password123'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'email' in data['error'].lower()
    
    def test_user_registration_missing_fields(self, client):
        """Test registration with missing required fields."""
        response = client.post('/api/auth/register', json={
            'username': 'newuser'
            # Missing email and password
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_user_login_success(self, client, test_user):
        """Test successful user login."""
        response = client.post('/api/auth/login', json={
            'username': test_user.username,
            'password': 'password123'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'refresh_token' in data
        assert 'user' in data
        assert data['user']['username'] == test_user.username
        assert data['user']['email'] == test_user.email
    
    def test_user_login_with_email(self, client, test_user):
        """Test login using email instead of username."""
        response = client.post('/api/auth/login', json={
            'username': test_user.email,
            'password': 'password123'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
    
    def test_user_login_invalid_credentials(self, client, test_user):
        """Test login with invalid password."""
        response = client.post('/api/auth/login', json={
            'username': test_user.username,
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_user_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_user_login_missing_fields(self, client):
        """Test login with missing fields."""
        response = client.post('/api/auth/login', json={
            'username': 'testuser'
            # Missing password
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_refresh_token(self, client, test_user):
        """Test token refresh."""
        # First login to get tokens
        login_response = client.post('/api/auth/login', json={
            'username': test_user.username,
            'password': 'password123'
        })
        
        refresh_token = login_response.get_json()['refresh_token']
        
        # Use refresh token to get new access token
        response = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {refresh_token}'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
    
    def test_protected_route_with_valid_token(self, client, auth_headers):
        """Test accessing protected route with valid token."""
        response = client.get('/api/users/profile', headers=auth_headers)
        assert response.status_code == 200
    
    def test_protected_route_without_token(self, client):
        """Test accessing protected route without token."""
        response = client.get('/api/users/profile')
        assert response.status_code == 401
    
    def test_protected_route_with_invalid_token(self, client):
        """Test accessing protected route with invalid token."""
        response = client.get('/api/users/profile', headers={
            'Authorization': 'Bearer invalid_token'
        })
        assert response.status_code == 422  # JWT decode error 