from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app import db
from app.models.security import TwoFactorAuth, UserSession, AuditLog, SecuritySettings
from app.models.user import User
from datetime import datetime, timedelta
import qrcode
import io
import base64
import json

security_bp = Blueprint('security', __name__, url_prefix='/api/security')

def get_client_info():
    """Extract client information from request"""
    return {
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', ''),
        'device_info': request.headers.get('X-Device-Info', 'Unknown')
    }

@security_bp.route('/2fa/setup', methods=['POST'])
@jwt_required()
def setup_2fa():
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        # Check if 2FA already exists
        two_factor = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        if two_factor and two_factor.is_enabled:
            return jsonify({'error': '2FA is already enabled'}), 400
        
        # Create or update 2FA record
        if not two_factor:
            two_factor = TwoFactorAuth(user_id=user_id)
            db.session.add(two_factor)
        
        # Generate new secret and backup codes
        secret = two_factor.generate_secret()
        backup_codes = two_factor.generate_backup_codes()
        
        db.session.commit()
        
        # Generate QR code
        qr_url = two_factor.get_qr_code_url(user.username)
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_str = base64.b64encode(img_buffer.getvalue()).decode()
        
        # Log the action
        client_info = get_client_info()
        AuditLog.log_action(
            user_id=user_id,
            action='2fa_setup_initiated',
            details=json.dumps({'secret_generated': True}),
            **client_info
        )
        
        return jsonify({
            'secret': secret,
            'qr_code': f'data:image/png;base64,{img_str}',
            'backup_codes': backup_codes,
            'setup_url': qr_url
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@security_bp.route('/2fa/verify', methods=['POST'])
@jwt_required()
def verify_2fa_setup():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return jsonify({'error': 'Code is required'}), 400
        
        two_factor = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        if not two_factor:
            return jsonify({'error': '2FA not set up'}), 400
        
        if two_factor.verify_code(code, allow_when_disabled=True):
            two_factor.is_enabled = True
            db.session.commit()
            
            # Log the action
            client_info = get_client_info()
            AuditLog.log_action(
                user_id=user_id,
                action='2fa_enabled',
                details=json.dumps({'verification_successful': True}),
                **client_info
            )
            
            return jsonify({'message': '2FA enabled successfully'})
        else:
            return jsonify({'error': 'Invalid code'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@security_bp.route('/2fa/disable', methods=['POST'])
@jwt_required()
def disable_2fa():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return jsonify({'error': 'Code is required'}), 400
        
        two_factor = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        if not two_factor or not two_factor.is_enabled:
            return jsonify({'error': '2FA is not enabled'}), 400
        
        if two_factor.verify_code(code):
            two_factor.is_enabled = False
            db.session.commit()
            
            # Log the action
            client_info = get_client_info()
            AuditLog.log_action(
                user_id=user_id,
                action='2fa_disabled',
                details=json.dumps({'disable_successful': True}),
                **client_info
            )
            
            return jsonify({'message': '2FA disabled successfully'})
        else:
            return jsonify({'error': 'Invalid code'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@security_bp.route('/2fa/status', methods=['GET'])
@jwt_required()
def get_2fa_status():
    try:
        user_id = get_jwt_identity()
        two_factor = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        
        return jsonify({
            'is_enabled': two_factor.is_enabled if two_factor else False,
            'backup_codes_remaining': len(two_factor.backup_codes.split(',')) if two_factor and two_factor.backup_codes else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@security_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    try:
        user_id = get_jwt_identity()
        sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()
        
        result = []
        for session in sessions:
            result.append({
                'id': session.id,
                'device_info': session.device_info,
                'ip_address': session.ip_address,
                'created_at': session.created_at.isoformat() if session.created_at else None,
                'last_activity': session.last_activity.isoformat() if session.last_activity else None,
                'is_current': session.session_token == request.headers.get('X-Session-Token', '')
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@security_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def revoke_session(session_id):
    try:
        user_id = get_jwt_identity()
        session = UserSession.query.filter_by(id=session_id, user_id=user_id).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        session.is_active = False
        db.session.commit()
        
        # Log the action
        client_info = get_client_info()
        AuditLog.log_action(
            user_id=user_id,
            action='session_revoked',
            details=json.dumps({'session_id': session_id}),
            **client_info
        )
        
        return jsonify({'message': 'Session revoked successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@security_bp.route('/sessions/revoke-all', methods=['POST'])
@jwt_required()
def revoke_all_sessions():
    try:
        user_id = get_jwt_identity()
        current_token = request.headers.get('X-Session-Token', '')
        
        # Revoke all sessions except current one
        sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()
        revoked_count = 0
        
        for session in sessions:
            if session.session_token != current_token:
                session.is_active = False
                revoked_count += 1
        
        db.session.commit()
        
        # Log the action
        client_info = get_client_info()
        AuditLog.log_action(
            user_id=user_id,
            action='all_sessions_revoked',
            details=json.dumps({'revoked_count': revoked_count}),
            **client_info
        )
        
        return jsonify({'message': f'{revoked_count} sessions revoked successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@security_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_security_settings():
    try:
        user_id = get_jwt_identity()
        settings = SecuritySettings.query.filter_by(user_id=user_id).first()
        
        if not settings:
            # Create default settings
            settings = SecuritySettings(user_id=user_id)
            db.session.add(settings)
            db.session.commit()
        
        return jsonify({
            'require_2fa': settings.require_2fa,
            'max_sessions': settings.max_sessions,
            'session_timeout_hours': settings.session_timeout_hours,
            'login_notifications': settings.login_notifications,
            'suspicious_activity_alerts': settings.suspicious_activity_alerts,
            'password_change_required': settings.password_change_required,
            'last_password_change': settings.last_password_change.isoformat() if settings.last_password_change else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@security_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_security_settings():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        settings = SecuritySettings.query.filter_by(user_id=user_id).first()
        if not settings:
            settings = SecuritySettings(user_id=user_id)
            db.session.add(settings)
        
        # Update settings
        if 'require_2fa' in data:
            settings.require_2fa = data['require_2fa']
        if 'max_sessions' in data:
            settings.max_sessions = data['max_sessions']
        if 'session_timeout_hours' in data:
            settings.session_timeout_hours = data['session_timeout_hours']
        if 'login_notifications' in data:
            settings.login_notifications = data['login_notifications']
        if 'suspicious_activity_alerts' in data:
            settings.suspicious_activity_alerts = data['suspicious_activity_alerts']
        
        db.session.commit()
        
        # Log the action
        client_info = get_client_info()
        AuditLog.log_action(
            user_id=user_id,
            action='security_settings_updated',
            details=json.dumps(data),
            **client_info
        )
        
        return jsonify({'message': 'Security settings updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@security_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        logs = AuditLog.query.filter_by(user_id=user_id)\
            .order_by(AuditLog.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for log in logs.items:
            result.append({
                'id': log.id,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'details': log.details,
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'created_at': log.created_at.isoformat() if log.created_at else None
            })
        
        return jsonify({
            'logs': result,
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@security_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new password are required'}), 400
        
        user = User.query.get_or_404(user_id)
        
        # Verify current password
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Update password
        user.set_password(new_password)
        
        # Update security settings
        settings = SecuritySettings.query.filter_by(user_id=user_id).first()
        if not settings:
            settings = SecuritySettings(user_id=user_id)
            db.session.add(settings)
        
        settings.last_password_change = datetime.utcnow()
        settings.password_change_required = False
        
        db.session.commit()
        
        # Log the action
        client_info = get_client_info()
        AuditLog.log_action(
            user_id=user_id,
            action='password_changed',
            details=json.dumps({'password_changed': True}),
            **client_info
        )
        
        return jsonify({'message': 'Password changed successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 