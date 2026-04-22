import pytest
from app import db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.user import User

class TestGroups:
    """Test group management endpoints."""
    
    def test_create_group_success(self, client, auth_headers, test_user):
        """Test successful group creation."""
        response = client.post('/api/groups', json={
            'name': 'New Test Group',
            'description': 'A new test group'
        }, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'message' in data
        assert 'group' in data
        assert data['group']['name'] == 'New Test Group'
        assert data['group']['description'] == 'A new test group'
        assert data['group']['created_by'] == test_user.id
        
        # Verify group was created in database
        group = Group.query.filter_by(name='New Test Group').first()
        assert group is not None
        assert group.description == 'A new test group'
        
        # Verify creator was added as member
        member = GroupMember.query.filter_by(
            group_id=group.id,
            user_id=test_user.id
        ).first()
        assert member is not None
        assert member.role == 'admin'
    
    def test_create_group_missing_name(self, client, auth_headers):
        """Test group creation without name."""
        response = client.post('/api/groups', json={
            'description': 'A test group'
        }, headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_create_group_unauthorized(self, client):
        """Test group creation without authentication."""
        response = client.post('/api/groups', json={
            'name': 'New Test Group',
            'description': 'A new test group'
        })
        
        assert response.status_code == 401
    
    def test_get_groups_success(self, client, auth_headers, test_group):
        """Test getting user's groups."""
        response = client.get('/api/groups', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our test group
        group_data = next((g for g in data if g['id'] == test_group.id), None)
        assert group_data is not None
        assert group_data['name'] == test_group.name
        assert group_data['description'] == test_group.description
    
    def test_get_groups_unauthorized(self, client):
        """Test getting groups without authentication."""
        response = client.get('/api/groups')
        assert response.status_code == 401
    
    def test_get_group_detail_success(self, client, auth_headers, test_group):
        """Test getting specific group details."""
        response = client.get(f'/api/groups/{test_group.id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == test_group.id
        assert data['name'] == test_group.name
        assert data['description'] == test_group.description
        assert 'members' in data
        assert isinstance(data['members'], list)
    
    def test_get_group_detail_not_found(self, client, auth_headers):
        """Test getting non-existent group."""
        response = client.get('/api/groups/99999', headers=auth_headers)
        assert response.status_code == 404
    
    def test_get_group_detail_unauthorized(self, client, test_group):
        """Test getting group without authentication."""
        response = client.get(f'/api/groups/{test_group.id}')
        assert response.status_code == 401
    
    def test_update_group_success(self, client, auth_headers, test_group):
        """Test successful group update."""
        response = client.put(f'/api/groups/{test_group.id}', json={
            'name': 'Updated Group Name',
            'description': 'Updated description'
        }, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'message' in data
        
        # Verify group was updated in database
        updated_group = Group.query.get(test_group.id)
        assert updated_group.name == 'Updated Group Name'
        assert updated_group.description == 'Updated description'
    
    def test_update_group_not_found(self, client, auth_headers):
        """Test updating non-existent group."""
        response = client.put('/api/groups/99999', json={
            'name': 'Updated Name'
        }, headers=auth_headers)
        assert response.status_code == 404
    
    def test_update_group_unauthorized(self, client, test_group):
        """Test updating group without authentication."""
        response = client.put(f'/api/groups/{test_group.id}', json={
            'name': 'Updated Name'
        })
        assert response.status_code == 401
    
    def test_delete_group_success(self, client, auth_headers, test_group):
        """Test successful group deletion."""
        response = client.delete(f'/api/groups/{test_group.id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'message' in data
        
        # Verify group was deleted from database
        deleted_group = Group.query.get(test_group.id)
        assert deleted_group is None
    
    def test_delete_group_not_found(self, client, auth_headers):
        """Test deleting non-existent group."""
        response = client.delete('/api/groups/99999', headers=auth_headers)
        assert response.status_code == 404
    
    def test_delete_group_unauthorized(self, client, test_group):
        """Test deleting group without authentication."""
        response = client.delete(f'/api/groups/{test_group.id}')
        assert response.status_code == 401
    
    def test_add_member_success(self, client, auth_headers, test_group, test_user2):
        """Test adding member to group."""
        response = client.post(f'/api/groups/{test_group.id}/members', json={
            'user_id': test_user2.id
        }, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'message' in data
        
        # Verify member was added
        member = GroupMember.query.filter_by(
            group_id=test_group.id,
            user_id=test_user2.id
        ).first()
        assert member is not None
        assert member.role == 'member'
    
    def test_add_member_already_exists(self, client, auth_headers, test_group, test_user):
        """Test adding member who is already in group."""
        response = client.post(f'/api/groups/{test_group.id}/members', json={
            'user_id': test_user.id
        }, headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_remove_member_success(self, client, auth_headers, test_group, test_user2):
        """Test removing member from group."""
        # First add the member
        member = GroupMember(
            group_id=test_group.id,
            user_id=test_user2.id,
            role='member'
        )
        db.session.add(member)
        db.session.commit()
        
        # Then remove them
        response = client.delete(f'/api/groups/{test_group.id}/members/{test_user2.id}', 
                               headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'message' in data
        
        # Verify member was removed
        removed_member = GroupMember.query.filter_by(
            group_id=test_group.id,
            user_id=test_user2.id
        ).first()
        assert removed_member is None
    
    def test_remove_member_not_found(self, client, auth_headers, test_group):
        """Test removing non-existent member."""
        response = client.delete(f'/api/groups/{test_group.id}/members/99999', 
                               headers=auth_headers)
        assert response.status_code == 404
    
    def test_get_group_expenses(self, client, auth_headers, test_group, test_expense):
        """Test getting group expenses."""
        response = client.get(f'/api/groups/{test_group.id}/expenses', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our test expense
        expense_data = next((e for e in data if e['id'] == test_expense.id), None)
        assert expense_data is not None
        assert expense_data['title'] == test_expense.title
        assert expense_data['amount'] == test_expense.amount
    
    def test_get_group_payments(self, client, auth_headers, test_group, test_payment):
        """Test getting group payments."""
        response = client.get(f'/api/groups/{test_group.id}/payments', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our test payment
        payment_data = next((p for p in data if p['id'] == test_payment.id), None)
        assert payment_data is not None
        assert payment_data['amount'] == float(test_payment.amount)
        assert payment_data['status'] == test_payment.status 