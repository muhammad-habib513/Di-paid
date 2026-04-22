from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.group import Group
from app.models.chat import ChatRoom
from app.models.group_member import GroupMember
from app.models.user import User
from app.models.notification import Notification

group_bp = Blueprint('group', __name__, url_prefix='/api/groups')

@group_bp.route('', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_group():
	try:
		data = request.get_json()
		name = data.get('name')
		description = data.get('description', '')
		
		if not name:
			return jsonify({'error': 'Group name is required'}), 400
			
		user_id = int(get_jwt_identity())
		group = Group(name=name, description=description, created_by=user_id)
		db.session.add(group)
		db.session.commit()
		
		# Add creator as admin member
		member = GroupMember(group_id=group.id, user_id=user_id, role='admin')
		db.session.add(member)
		db.session.commit()

		# Ensure a chat room exists for this group so it appears in Chat
		chat_room = ChatRoom.query.filter_by(group_id=group.id).first()
		if not chat_room:
			chat_room = ChatRoom(
				group_id=group.id,
				name=group.name,
				description=f"Chat for group {group.name}"
			)
			db.session.add(chat_room)
			db.session.commit()
		
		# Return the created group with member info
		return jsonify({
			'id': group.id, 
			'name': group.name, 
			'description': group.description,
			'created_by': user_id,
			'created_at': group.created_at.isoformat(),
			'chat_room_id': chat_room.id,
			'members': [{
				'id': user_id,
				'username': User.query.get(user_id).username,
				'email': User.query.get(user_id).email,
				'role': 'admin'
			}]
		}), 201
	except Exception as e:
		db.session.rollback()
		return jsonify({'error': str(e)}), 500

@group_bp.route('', methods=['GET'], strict_slashes=False)
@jwt_required()
def list_groups():
	try:
		user_id = int(get_jwt_identity())
		print("User ID:", user_id)
		memberships = GroupMember.query.filter_by(user_id=user_id).all()
		print("Memberships:", memberships)
		groups = []
		
		for membership in memberships:
			group = Group.query.get(membership.group_id)
			if group:
				# Get all members for this group
				group_members = GroupMember.query.filter_by(group_id=group.id).all()
				members = []
				for member in group_members:
					user = User.query.get(member.user_id)
					if user:
						members.append({
							'id': user.id,
							'username': user.username,
							'email': user.email,
							'role': member.role
						})
				
				groups.append({
					'id': group.id, 
					'name': group.name, 
					'description': group.description,
					'created_by': group.created_by,
					'created_at': group.created_at.isoformat(),
					'members': members
				})
		
		return jsonify(groups)
	except Exception as e:
		return jsonify({'error': str(e)}), 500

@group_bp.route('/<int:group_id>', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_group(group_id):
	try:
		user_id = int(get_jwt_identity())
		group = Group.query.get_or_404(group_id)
		
		# Check if user is a member of this group
		membership = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
		if not membership:
			return jsonify({'error': 'Access denied'}), 403
		
		# Get all members
		group_members = GroupMember.query.filter_by(group_id=group_id).all()
		members = []
		for member in group_members:
			user = User.query.get(member.user_id)
			if user:
				members.append({
					'id': user.id,
					'username': user.username,
					'email': user.email,
					'role': member.role
				})
		
		return jsonify({
			'id': group.id, 
			'name': group.name, 
			'description': group.description,
			'created_by': group.created_by,
			'created_at': group.created_at.isoformat(),
			'members': members
		})
	except Exception as e:
		return jsonify({'error': str(e)}), 500

@group_bp.route('/<int:group_id>', methods=['PUT'], strict_slashes=False)
@jwt_required()
def update_group(group_id):
	try:
		user_id = int(get_jwt_identity())
		group = Group.query.get_or_404(group_id)
		
		# Check if user is admin of this group
		membership = GroupMember.query.filter_by(group_id=group_id, user_id=user_id, role='admin').first()
		if not membership:
			return jsonify({'error': 'Only admins can update groups'}), 403
		
		data = request.get_json()
		if 'name' in data:
			group.name = data['name']
		if 'description' in data:
			group.description = data['description']
			
		db.session.commit()
		return jsonify({'message': 'Group updated successfully'})
	except Exception as e:
		db.session.rollback()
		return jsonify({'error': str(e)}), 500

@group_bp.route('/<int:group_id>', methods=['DELETE'], strict_slashes=False)
@jwt_required()
def delete_group(group_id):
	try:
		user_id = int(get_jwt_identity())
		group = Group.query.get_or_404(group_id)
		
		# Check if user is admin of this group
		membership = GroupMember.query.filter_by(group_id=group_id, user_id=user_id, role='admin').first()
		if not membership:
			return jsonify({'error': 'Only admins can delete groups'}), 403
		
		# Delete all members first
		GroupMember.query.filter_by(group_id=group_id).delete()
		db.session.delete(group)
		db.session.commit()
		return jsonify({'message': 'Group deleted successfully'})
	except Exception as e:
		db.session.rollback()
		return jsonify({'error': str(e)}), 500

@group_bp.route('/<int:group_id>/members', methods=['POST'], strict_slashes=False)
@jwt_required()
def add_member(group_id):
	try:
		user_id = int(get_jwt_identity())
		data = request.get_json()
		new_user_id = data.get('user_id')
		
		if not new_user_id:
			return jsonify({'error': 'User ID is required'}), 400
			
		# Check if group exists
		group = Group.query.get_or_404(group_id)
		
		# Check if current user is admin
		membership = GroupMember.query.filter_by(group_id=group_id, user_id=user_id, role='admin').first()
		if not membership:
			return jsonify({'error': 'Only admins can add members'}), 403
		
		# Check if user exists
		if not User.query.get(new_user_id):
			return jsonify({'error': 'User not found'}), 404
			
		# Check if user is already a member
		if GroupMember.query.filter_by(group_id=group_id, user_id=new_user_id).first():
			return jsonify({'error': 'User is already a member'}), 409
		
		member = GroupMember(group_id=group_id, user_id=new_user_id, role='member')
		db.session.add(member)
		db.session.commit()
		
		# Notify the added user
		adder = User.query.get(user_id)
		notification = Notification(
			user_id=new_user_id,
			message=f'You were added to group "{group.name}" by {adder.username}',
			type='group'
		)
		db.session.add(notification)
		db.session.commit()
		
		return jsonify({'message': 'Member added successfully'})
	except Exception as e:
		db.session.rollback()
		return jsonify({'error': str(e)}), 500

@group_bp.route('/<int:group_id>/members/<int:member_user_id>', methods=['DELETE'], strict_slashes=False)
@jwt_required()
def remove_member(group_id, member_user_id):
	try:
		user_id = int(get_jwt_identity())
		
		# Check if current user is admin
		membership = GroupMember.query.filter_by(group_id=group_id, user_id=user_id, role='admin').first()
		if not membership:
			return jsonify({'error': 'Only admins can remove members'}), 403
		
		# Check if member exists
		member = GroupMember.query.filter_by(group_id=group_id, user_id=member_user_id).first()
		if not member:
			return jsonify({'error': 'Member not found'}), 404
		
		# Don't allow removing the last admin
		if member.role == 'admin':
			admin_count = GroupMember.query.filter_by(group_id=group_id, role='admin').count()
			if admin_count <= 1:
				return jsonify({'error': 'Cannot remove the last admin'}), 400
		
		db.session.delete(member)
		db.session.commit()
		return jsonify({'message': 'Member removed successfully'})
	except Exception as e:
		db.session.rollback()
		return jsonify({'error': str(e)}), 500

@group_bp.route('/users', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_users():
	"""Get all users for adding to groups"""
	try:
		users = User.query.all()
		return jsonify([{
			'id': user.id,
			'username': user.username,
			'email': user.email
		} for user in users])
	except Exception as e:
		return jsonify({'error': str(e)}), 500 