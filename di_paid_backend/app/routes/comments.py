from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.comment import Comment
from app.models.expense import Expense

comments_bp = Blueprint('comments', __name__, url_prefix='/api/comments')

@comments_bp.route('/<int:expense_id>', methods=['POST'])
@jwt_required()
def add_comment(expense_id):
    data = request.get_json()
    user_id = get_jwt_identity()
    content = data.get('content')
    if not content:
        return jsonify({'error': 'Content required'}), 400
    comment = Comment(expense_id=expense_id, user_id=user_id, content=content)
    db.session.add(comment)
    db.session.commit()
    return jsonify({'id': comment.id, 'content': comment.content, 'created_at': comment.created_at}), 201

@comments_bp.route('/<int:expense_id>', methods=['GET'])
@jwt_required()
def list_comments(expense_id):
    comments = Comment.query.filter_by(expense_id=expense_id).order_by(Comment.created_at.asc()).all()
    return jsonify([
        {'id': c.id, 'user_id': c.user_id, 'content': c.content, 'created_at': c.created_at}
        for c in comments
    ])

@comments_bp.route('/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted'}) 