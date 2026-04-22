from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.friendship import Friendship
from app.models.activity import Activity
from app.models.user import User
from app.models.group import Group
from app.models.expense import Expense
from app.models.payment import Payment
from datetime import datetime, timedelta
import json

social_bp = Blueprint('social', __name__, url_prefix='/api/social')

# Friend Management Routes
@social_bp.route('/friends/request', methods=['POST'])
@jwt_required()
def send_friend_request():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        friend_username = data.get('username')
        
        if not friend_username:
            return jsonify({'error': 'Username is required'}), 400
        
        # Find the friend by username
        friend = User.query.filter_by(username=friend_username).first()
        if not friend:
            return jsonify({'error': 'User not found'}), 404
        
        if friend.id == user_id:
            return jsonify({'error': 'Cannot send friend request to yourself'}), 400
        
        # Check if friendship already exists
        existing_friendship = Friendship.query.filter(
            ((Friendship.requester_id == user_id) & (Friendship.addressee_id == friend.id)) |
            ((Friendship.requester_id == friend.id) & (Friendship.addressee_id == user_id))
        ).first()
        
        if existing_friendship:
            if existing_friendship.status == 'accepted':
                return jsonify({'error': 'Already friends'}), 400
            elif existing_friendship.status == 'pending':
                if existing_friendship.requester_id == user_id:
                    return jsonify({'error': 'Friend request already sent'}), 400
                else:
                    return jsonify({'error': 'Friend request already received'}), 400
        
        # Create new friendship request
        friendship = Friendship(
            requester_id=user_id,
            addressee_id=friend.id,
            status='pending'
        )
        db.session.add(friendship)
        db.session.commit()
        
        # Log activity
        Activity.log_activity(
            user_id=user_id,
            activity_type='friend_request_sent',
            title=f'Sent friend request to {friend.username}',
            description=f'You sent a friend request to {friend.username}',
            resource_type='friendship',
            resource_id=friendship.id,
            is_public=False
        )
        
        return jsonify({
            'message': f'Friend request sent to {friend.username}',
            'friendship': friendship.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_bp.route('/friends/requests', methods=['GET'])
@jwt_required()
def get_friend_requests():
    try:
        user_id = get_jwt_identity()
        
        # Get pending friend requests received by user
        requests = Friendship.query.filter_by(
            addressee_id=user_id, 
            status='pending'
        ).all()
        
        result = []
        for req in requests:
            requester = User.query.get(req.requester_id)
            result.append({
                'id': req.id,
                'requester': {
                    'id': requester.id,
                    'username': requester.username,
                    'email': requester.email
                },
                'status': req.status,
                'created_at': req.created_at.isoformat() if req.created_at else None
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/friends/requests/<int:request_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_friend_request(request_id):
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        response = data.get('response')  # 'accept' or 'reject'
        
        if response not in ['accept', 'reject']:
            return jsonify({'error': 'Response must be "accept" or "reject"'}), 400
        
        # Find the friend request
        friendship = Friendship.query.filter_by(
            id=request_id,
            addressee_id=user_id,
            status='pending'
        ).first()
        
        if not friendship:
            return jsonify({'error': 'Friend request not found'}), 404
        
        # Update friendship status
        friendship.status = 'accepted' if response == 'accept' else 'rejected'
        friendship.updated_at = datetime.utcnow()
        
        # Log activity
        requester = User.query.get(friendship.requester_id)
        activity_type = 'friend_request_accepted' if response == 'accept' else 'friend_request_rejected'
        title = f'{response.title()} friend request from {requester.username}'
        
        Activity.log_activity(
            user_id=user_id,
            activity_type=activity_type,
            title=title,
            description=f'You {response}ed a friend request from {requester.username}',
            resource_type='friendship',
            resource_id=friendship.id,
            is_public=False
        )
        
        db.session.commit()
        
        return jsonify({
            'message': f'Friend request {response}ed',
            'friendship': friendship.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_bp.route('/friends', methods=['GET'])
@jwt_required()
def get_friends():
    try:
        user_id = get_jwt_identity()
        
        # Get accepted friendships
        friendships = Friendship.query.filter(
            ((Friendship.requester_id == user_id) | (Friendship.addressee_id == user_id)) &
            (Friendship.status == 'accepted')
        ).all()
        
        friends = []
        for friendship in friendships:
            # Determine which user is the friend
            friend_id = friendship.addressee_id if friendship.requester_id == user_id else friendship.requester_id
            friend = User.query.get(friend_id)
            
            friends.append({
                'id': friend.id,
                'username': friend.username,
                'email': friend.email,
                'friendship_id': friendship.id,
                'friends_since': friendship.updated_at.isoformat() if friendship.updated_at else None
            })
        
        return jsonify(friends)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/friends/<int:friend_id>', methods=['DELETE'])
@jwt_required()
def remove_friend(friend_id):
    try:
        user_id = get_jwt_identity()
        
        # Find the friendship
        friendship = Friendship.query.filter(
            ((Friendship.requester_id == user_id) & (Friendship.addressee_id == friend_id)) |
            ((Friendship.requester_id == friend_id) & (Friendship.addressee_id == user_id)),
            Friendship.status == 'accepted'
        ).first()
        
        if not friendship:
            return jsonify({'error': 'Friendship not found'}), 404
        
        # Log activity before deletion
        friend = User.query.get(friend_id)
        Activity.log_activity(
            user_id=user_id,
            activity_type='friend_removed',
            title=f'Removed {friend.username} from friends',
            description=f'You removed {friend.username} from your friends list',
            is_public=False
        )
        
        db.session.delete(friendship)
        db.session.commit()
        
        return jsonify({'message': f'Removed {friend.username} from friends'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Activity Feed Routes
@social_bp.route('/activity-feed', methods=['GET'])
@jwt_required()
def get_activity_feed():
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get user's friends
        friendships = Friendship.query.filter(
            ((Friendship.requester_id == user_id) | (Friendship.addressee_id == user_id)) &
            (Friendship.status == 'accepted')
        ).all()
        
        friend_ids = []
        for friendship in friendships:
            friend_id = friendship.addressee_id if friendship.requester_id == user_id else friendship.requester_id
            friend_ids.append(friend_id)
        
        # Get public activities from friends and user's own activities
        activities = Activity.query.filter(
            (Activity.user_id.in_(friend_ids) & (Activity.is_public == True)) |
            (Activity.user_id == user_id)
        ).order_by(Activity.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        result = []
        for activity in activities.items:
            user = User.query.get(activity.user_id)
            group = Group.query.get(activity.group_id) if activity.group_id else None
            
            activity_data = activity.to_dict()
            activity_data['user'] = {
                'id': user.id,
                'username': user.username
            }
            if group:
                activity_data['group'] = {
                    'id': group.id,
                    'name': group.name
                }
            
            result.append(activity_data)
        
        return jsonify({
            'activities': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': activities.total,
                'pages': activities.pages,
                'has_next': activities.has_next,
                'has_prev': activities.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/activity-feed/personal', methods=['GET'])
@jwt_required()
def get_personal_activity_feed():
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get user's own activities
        activities = Activity.query.filter_by(user_id=user_id).order_by(
            Activity.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for activity in activities.items:
            group = Group.query.get(activity.group_id) if activity.group_id else None
            
            activity_data = activity.to_dict()
            if group:
                activity_data['group'] = {
                    'id': group.id,
                    'name': group.name
                }
            
            result.append(activity_data)
        
        return jsonify({
            'activities': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': activities.total,
                'pages': activities.pages,
                'has_next': activities.has_next,
                'has_prev': activities.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Search Users Route
@social_bp.route('/search-users', methods=['GET'])
@jwt_required()
def search_users():
    try:
        user_id = get_jwt_identity()
        query = request.args.get('q', '')
        
        if not query or len(query) < 2:
            return jsonify({'error': 'Search query must be at least 2 characters'}), 400
        
        # Search users by username or email
        users = User.query.filter(
            (User.username.ilike(f'%{query}%')) | (User.email.ilike(f'%{query}%')),
            User.id != user_id
        ).limit(10).all()
        
        result = []
        for user in users:
            # Check friendship status
            friendship = Friendship.query.filter(
                ((Friendship.requester_id == user_id) & (Friendship.addressee_id == user.id)) |
                ((Friendship.requester_id == user.id) & (Friendship.addressee_id == user_id))
            ).first()
            
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
            
            if friendship:
                user_data['friendship_status'] = friendship.status
                user_data['friendship_id'] = friendship.id
            else:
                user_data['friendship_status'] = 'none'
            
            result.append(user_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 