from app import db
from datetime import datetime
import secrets
import pyotp

class TwoFactorAuth(db.Model):
    __tablename__ = 'two_factor_auth'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    secret_key = db.Column(db.String(32), nullable=False)
    is_enabled = db.Column(db.Boolean, default=False)
    backup_codes = db.Column(db.Text)  # JSON string of backup codes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used = db.Column(db.DateTime)
    
    # Relationship
    user = db.relationship('User', backref='two_factor')
    
    def __repr__(self):
        return f'<TwoFactorAuth {self.user_id}: {"enabled" if self.is_enabled else "disabled"}>'
    
    def generate_secret(self):
        """Generate a new secret key for 2FA"""
        self.secret_key = pyotp.random_base32()
        return self.secret_key
    
    def generate_backup_codes(self, count=8):
        """Generate backup codes for 2FA"""
        codes = [secrets.token_hex(4).upper() for _ in range(count)]
        self.backup_codes = ','.join(codes)
        return codes
    
    def verify_code(self, code, allow_when_disabled: bool = False):
        """Verify a 2FA code.
        If allow_when_disabled is True, allow verification even when 2FA hasn't been enabled yet
        (used during initial setup/verification step).
        """
        if not self.is_enabled and not allow_when_disabled:
            return False
        
        # Check if it's a backup code
        if self.backup_codes:
            backup_codes = self.backup_codes.split(',')
            if code in backup_codes:
                # Remove used backup code
                backup_codes.remove(code)
                self.backup_codes = ','.join(backup_codes)
                self.last_used = datetime.utcnow()
                return True
        
        # Verify TOTP code
        totp = pyotp.TOTP(self.secret_key)
        if totp.verify(code):
            self.last_used = datetime.utcnow()
            return True
        
        return False
    
    def get_qr_code_url(self, username):
        """Get QR code URL for 2FA setup"""
        totp = pyotp.TOTP(self.secret_key)
        return totp.provisioning_uri(username, issuer_name="Di-Paid")

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_token = db.Column(db.String(64), nullable=False, unique=True)
    device_info = db.Column(db.String(255))  # Browser, OS, etc.
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    # Relationship
    user = db.relationship('User', backref='sessions')
    
    def __repr__(self):
        return f'<UserSession {self.user_id}: {self.session_token[:8]}...>'
    
    def generate_token(self):
        """Generate a new session token"""
        self.session_token = secrets.token_urlsafe(32)
        return self.session_token
    
    def is_expired(self):
        """Check if session is expired"""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Null for anonymous actions
    action = db.Column(db.String(100), nullable=False)  # login, logout, create_expense, etc.
    resource_type = db.Column(db.String(50))  # user, group, expense, payment, etc.
    resource_id = db.Column(db.Integer)  # ID of the affected resource
    details = db.Column(db.Text)  # JSON string with additional details
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    session_id = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='audit_logs')
    
    def __repr__(self):
        return f'<AuditLog {self.action}: {self.user_id or "anonymous"}>'
    
    @classmethod
    def log_action(cls, user_id, action, resource_type=None, resource_id=None, 
                   details=None, ip_address=None, user_agent=None, session_id=None):
        """Log an audit action"""
        log = cls(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id
        )
        db.session.add(log)
        db.session.commit()
        return log

class SecuritySettings(db.Model):
    __tablename__ = 'security_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    require_2fa = db.Column(db.Boolean, default=False)
    max_sessions = db.Column(db.Integer, default=5)
    session_timeout_hours = db.Column(db.Integer, default=24)
    login_notifications = db.Column(db.Boolean, default=True)
    suspicious_activity_alerts = db.Column(db.Boolean, default=True)
    password_change_required = db.Column(db.Boolean, default=False)
    last_password_change = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='security_settings')
    
    def __repr__(self):
        return f'<SecuritySettings {self.user_id}>'
    
    def should_require_password_change(self, days=90):
        """Check if password change is required based on last change date"""
        if not self.last_password_change:
            return True
        
        days_since_change = (datetime.utcnow() - self.last_password_change).days
        return days_since_change > days 