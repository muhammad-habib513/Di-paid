from flask import Blueprint, jsonify, request, current_app
import os
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models.user import User
from app import db

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

@user_bp.route('', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_users():
    try:
        user_id = int(get_jwt_identity())
        print("User ID:", user_id)
        users = User.query.all()
        print("Users:", users)
        return jsonify([{
            'id': user.id,
            'username': user.username,
            'email': user.email
        } for user in users])
    except Exception as e:
        print("Error in get_users:", e)
        return jsonify({'error': str(e)}), 500

@user_bp.route('/upload-profile-image', methods=['POST'])
@jwt_required()
def upload_profile_image():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if 'file' not in request.files:
        return {'error': 'No file part'}, 400
    file = request.files['file']
    if file.filename == '':
        return {'error': 'No selected file'}, 400
    filename = secure_filename(file.filename)
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    file.save(file_path)
    rel_path = f'static/uploads/{filename}'
    user.profile_image = rel_path
    db.session.commit()
    return {'message': 'Profile image uploaded', 'profile_image': rel_path} 