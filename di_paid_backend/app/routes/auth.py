from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from app import mail, db
from app.models.user import User
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# In-memory store for reset tokens (for demo; use DB or cache in production)
reset_tokens = {}

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('name')  # Frontend sends 'name', we map it to 'username'
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already registered"}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Username already taken"}), 409

    hashed_password = generate_password_hash(password)
    user = User(username=username, email=email, password_hash=hashed_password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "msg": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200

@auth_bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'If the email exists, a reset link will be sent.'}), 200
    token = secrets.token_urlsafe(32)
    reset_tokens[token] = {'user_id': user.id, 'expires': datetime.utcnow() + timedelta(hours=1)}
    # Send email (for demo, just print)
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    try:
        msg = Message('Password Reset', recipients=[user.email])
        msg.body = f'Click the link to reset your password: {reset_link}'
        mail.send(msg)
    except Exception:
        print(f"Password reset link: {reset_link}")
    return jsonify({'message': 'If the email exists, a reset link will be sent.'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    info = reset_tokens.get(token)
    if not info or info['expires'] < datetime.utcnow():
        return jsonify({'error': 'Invalid or expired token'}), 400
    user = User.query.get(info['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    del reset_tokens[token]
    return jsonify({'message': 'Password reset successful'}), 200

@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    # Optionally handle profile_image, etc.
    if username:
        user.username = username
    if email:
        user.email = email
    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': {'id': user.id, 'username': user.username, 'email': user.email}}) 