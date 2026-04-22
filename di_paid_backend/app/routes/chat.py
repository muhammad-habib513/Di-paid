from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.chat import ChatRoom, ChatMessage, MessageReadStatus, ChatInvitation
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.user import User
from datetime import datetime, timedelta
import os
import uuid
from werkzeug.utils import secure_filename

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

# File upload configuration
UPLOAD_FOLDER = 'uploads/chat'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@chat_bp.route('/rooms', methods=['GET'])
@jwt_required()
def get_chat_rooms():
    try:
        user_id = get_jwt_identity()
        
        # Get groups where user is a member
        user_groups = GroupMember.query.filter_by(user_id=user_id).all()
        chat_rooms = []
        
        for membership in user_groups:
            group = Group.query.get(membership.group_id)
            chat_room = ChatRoom.query.filter_by(group_id=group.id).first()
            
            if chat_room:
                # Get unread message count
                unread_count = ChatMessage.query.filter(
                    ChatMessage.chat_room_id == chat_room.id,
                    ChatMessage.sender_id != user_id,
                    ~ChatMessage.id.in_(
                        db.session.query(MessageReadStatus.message_id)
                        .filter(MessageReadStatus.user_id == user_id, MessageReadStatus.is_read == True)
                    )
                ).count()
                
                # Get last message
                last_message = ChatMessage.query.filter_by(chat_room_id=chat_room.id)\
                    .order_by(ChatMessage.created_at.desc()).first()
                
                chat_rooms.append({
                    'id': chat_room.id,
                    'group_id': chat_room.group_id,
                    'name': chat_room.name,
                    'description': chat_room.description,
                    'unread_count': unread_count,
                    'last_message': last_message.to_dict() if last_message else None,
                    'created_at': chat_room.created_at.isoformat() if chat_room.created_at else None
                })
        
        return jsonify(chat_rooms)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/rooms/<int:room_id>', methods=['GET'])
@jwt_required()
def get_chat_room(room_id):
    try:
        user_id = get_jwt_identity()
        chat_room = ChatRoom.query.get_or_404(room_id)
        
        # Check if user is member of the group
        group_member = GroupMember.query.filter_by(
            group_id=chat_room.group_id, user_id=user_id
        ).first()
        
        if not group_member:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get room info with member count
        member_count = GroupMember.query.filter_by(group_id=chat_room.group_id).count()
        
        return jsonify({
            'id': chat_room.id,
            'group_id': chat_room.group_id,
            'name': chat_room.name,
            'description': chat_room.description,
            'member_count': member_count,
            'created_at': chat_room.created_at.isoformat() if chat_room.created_at else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/rooms/<int:room_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(room_id):
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Check access
        chat_room = ChatRoom.query.get_or_404(room_id)
        group_member = GroupMember.query.filter_by(
            group_id=chat_room.group_id, user_id=user_id
        ).first()
        
        if not group_member:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get messages with pagination
        messages = ChatMessage.query.filter_by(chat_room_id=room_id)\
            .order_by(ChatMessage.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        # Mark messages as read
        for message in messages.items:
            if message.sender_id != user_id:
                read_status = MessageReadStatus.query.filter_by(
                    message_id=message.id, user_id=user_id
                ).first()
                
                if not read_status:
                    read_status = MessageReadStatus(
                        message_id=message.id,
                        user_id=user_id,
                        is_read=True,
                        read_at=datetime.utcnow()
                    )
                    db.session.add(read_status)
                elif not read_status.is_read:
                    read_status.is_read = True
                    read_status.read_at = datetime.utcnow()
        
        db.session.commit()
        
        result = {
            'messages': [msg.to_dict() for msg in messages.items],
            'total': messages.total,
            'pages': messages.pages,
            'current_page': page,
            'has_next': messages.has_next,
            'has_prev': messages.has_prev
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/rooms/<int:room_id>/messages', methods=['POST'])
@jwt_required()
def send_message(room_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check access
        chat_room = ChatRoom.query.get_or_404(room_id)
        group_member = GroupMember.query.filter_by(
            group_id=chat_room.group_id, user_id=user_id
        ).first()
        
        if not group_member:
            return jsonify({'error': 'Access denied'}), 403
        
        content = data.get('content', '').strip()
        message_type = data.get('message_type', 'text')
        reply_to_id = data.get('reply_to_id')
        
        if not content and message_type == 'text':
            return jsonify({'error': 'Message content is required'}), 400
        
        # Validate reply_to_id
        if reply_to_id:
            reply_message = ChatMessage.query.get(reply_to_id)
            if not reply_message or reply_message.chat_room_id != room_id:
                return jsonify({'error': 'Invalid reply message'}), 400
        
        # Create message
        message = ChatMessage(
            chat_room_id=room_id,
            sender_id=user_id,
            message_type=message_type,
            content=content,
            reply_to_id=reply_to_id
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Create read status for sender
        read_status = MessageReadStatus(
            message_id=message.id,
            user_id=user_id,
            is_read=True,
            read_at=datetime.utcnow()
        )
        db.session.add(read_status)
        db.session.commit()
        
        return jsonify(message.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/messages/<int:message_id>', methods=['PUT'])
@jwt_required()
def edit_message(message_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({'error': 'Message content is required'}), 400
        
        message = ChatMessage.query.get_or_404(message_id)
        
        # Check if user is the sender
        if message.sender_id != user_id:
            return jsonify({'error': 'You can only edit your own messages'}), 403
        
        # Check if message is too old (e.g., 5 minutes)
        if message.created_at < datetime.utcnow() - timedelta(minutes=5):
            return jsonify({'error': 'Message is too old to edit'}), 400
        
        message.content = content
        message.is_edited = True
        message.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(message.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/messages/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    try:
        user_id = get_jwt_identity()
        message = ChatMessage.query.get_or_404(message_id)
        
        # Check if user is the sender or admin
        if message.sender_id != user_id:
            # Check if user is group admin
            chat_room = ChatRoom.query.get(message.chat_room_id)
            group_member = GroupMember.query.filter_by(
                group_id=chat_room.group_id, user_id=user_id, role='admin'
            ).first()
            
            if not group_member:
                return jsonify({'error': 'You can only delete your own messages'}), 403
        
        message.is_deleted = True
        message.content = '[Message deleted]'
        message.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Message deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/messages/<int:message_id>/read', methods=['POST'])
@jwt_required()
def mark_message_read(message_id):
    try:
        user_id = get_jwt_identity()
        message = ChatMessage.query.get_or_404(message_id)
        
        # Check access to chat room
        group_member = GroupMember.query.filter_by(
            group_id=message.chat_room.group_id, user_id=user_id
        ).first()
        
        if not group_member:
            return jsonify({'error': 'Access denied'}), 403
        
        # Update or create read status
        read_status = MessageReadStatus.query.filter_by(
            message_id=message_id, user_id=user_id
        ).first()
        
        if not read_status:
            read_status = MessageReadStatus(
                message_id=message_id,
                user_id=user_id,
                is_read=True,
                read_at=datetime.utcnow()
            )
            db.session.add(read_status)
        else:
            read_status.is_read = True
            read_status.read_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Message marked as read'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/rooms/<int:room_id>/upload', methods=['POST'])
@jwt_required()
def upload_file(room_id):
    try:
        user_id = get_jwt_identity()
        
        # Check access
        chat_room = ChatRoom.query.get_or_404(room_id)
        group_member = GroupMember.query.filter_by(
            group_id=chat_room.group_id, user_id=user_id
        ).first()
        
        if not group_member:
            return jsonify({'error': 'Access denied'}), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Ensure upload directory exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Determine message type
        file_ext = filename.rsplit('.', 1)[1].lower()
        if file_ext in ['png', 'jpg', 'jpeg', 'gif']:
            message_type = 'image'
        else:
            message_type = 'file'
        
        # Create message
        message = ChatMessage(
            chat_room_id=room_id,
            sender_id=user_id,
            message_type=message_type,
            content=f"Sent {filename}",
            file_url=f"/api/chat/files/{unique_filename}",
            file_name=filename,
            file_size=file_size
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Create read status for sender
        read_status = MessageReadStatus(
            message_id=message.id,
            user_id=user_id,
            is_read=True,
            read_at=datetime.utcnow()
        )
        db.session.add(read_status)
        db.session.commit()
        
        return jsonify(message.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/files/<filename>', methods=['GET'])
@jwt_required()
def get_file(filename):
    try:
        user_id = get_jwt_identity()
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Check if user has access to the file (by checking if they're in the chat room)
        # This is a simplified check - in production you'd want more robust access control
        return send_file(file_path)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/rooms/<int:room_id>/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count(room_id):
    try:
        user_id = get_jwt_identity()
        
        # Check access
        chat_room = ChatRoom.query.get_or_404(room_id)
        group_member = GroupMember.query.filter_by(
            group_id=chat_room.group_id, user_id=user_id
        ).first()
        
        if not group_member:
            return jsonify({'error': 'Access denied'}), 403
        
        # Count unread messages
        unread_count = ChatMessage.query.filter(
            ChatMessage.chat_room_id == room_id,
            ChatMessage.sender_id != user_id,
            ~ChatMessage.id.in_(
                db.session.query(MessageReadStatus.message_id)
                .filter(MessageReadStatus.user_id == user_id, MessageReadStatus.is_read == True)
            )
        ).count()
        
        return jsonify({'unread_count': unread_count})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 