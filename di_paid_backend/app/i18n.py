from flask import request, session
from flask_babel import Babel, gettext, ngettext, lazy_gettext
from app import babel

# Initialize Babel
def init_babel(app):
    """Initialize Babel for internationalization."""
    babel.init_app(app)
    
    # Configure Babel
    app.config['BABEL_DEFAULT_LOCALE'] = 'en'
    app.config['BABEL_SUPPORTED_LOCALES'] = ['en', 'es', 'fr', 'de', 'ar']
    app.config['BABEL_TRANSLATION_DIRECTORIES'] = 'app/translations'
    
    return babel

# These are now plain functions, not decorated

def get_locale():
    """Get the locale for the current request."""
    if 'locale' in session:
        return session['locale']
    if request.args.get('lang'):
        return request.args.get('lang')
    return request.accept_languages.best_match(['en', 'es', 'fr', 'de', 'ar'])

def get_timezone():
    """Get the timezone for the current request."""
    return 'UTC'

# Translation functions
def get_translated_text(key, **kwargs):
    """Get translated text by key."""
    return gettext(key) % kwargs if kwargs else gettext(key)

def get_translated_text_plural(singular, plural, count, **kwargs):
    """Get translated text with pluralization."""
    return ngettext(singular, plural, count) % kwargs if kwargs else ngettext(singular, plural, count)

# Common translation keys
class Messages:
    """Common message keys for translation."""
    
    # Authentication messages
    USER_REGISTERED = lazy_gettext('User registered successfully')
    LOGIN_SUCCESS = lazy_gettext('Login successful')
    LOGIN_FAILED = lazy_gettext('Invalid credentials')
    LOGOUT_SUCCESS = lazy_gettext('Logout successful')
    
    # Group messages
    GROUP_CREATED = lazy_gettext('Group created successfully')
    GROUP_UPDATED = lazy_gettext('Group updated successfully')
    GROUP_DELETED = lazy_gettext('Group deleted successfully')
    GROUP_NOT_FOUND = lazy_gettext('Group not found')
    
    # Expense messages
    EXPENSE_CREATED = lazy_gettext('Expense created successfully')
    EXPENSE_UPDATED = lazy_gettext('Expense updated successfully')
    EXPENSE_DELETED = lazy_gettext('Expense deleted successfully')
    EXPENSE_NOT_FOUND = lazy_gettext('Expense not found')
    
    # Payment messages
    PAYMENT_CREATED = lazy_gettext('Payment created successfully')
    PAYMENT_UPDATED = lazy_gettext('Payment updated successfully')
    PAYMENT_COMPLETED = lazy_gettext('Payment completed successfully')
    PAYMENT_NOT_FOUND = lazy_gettext('Payment not found')
    
    # Social messages
    FRIEND_REQUEST_SENT = lazy_gettext('Friend request sent successfully')
    FRIEND_REQUEST_ACCEPTED = lazy_gettext('Friend request accepted')
    FRIEND_REQUEST_REJECTED = lazy_gettext('Friend request rejected')
    FRIEND_REMOVED = lazy_gettext('Friend removed successfully')
    
    # Budget messages
    BUDGET_CREATED = lazy_gettext('Budget created successfully')
    BUDGET_UPDATED = lazy_gettext('Budget updated successfully')
    BUDGET_DELETED = lazy_gettext('Budget deleted successfully')
    BUDGET_EXCEEDED = lazy_gettext('Budget limit exceeded')
    
    # Error messages
    VALIDATION_ERROR = lazy_gettext('Validation error')
    UNAUTHORIZED = lazy_gettext('Unauthorized access')
    NOT_FOUND = lazy_gettext('Resource not found')
    SERVER_ERROR = lazy_gettext('Internal server error')
    MISSING_FIELDS = lazy_gettext('Missing required fields')
    DUPLICATE_ENTRY = lazy_gettext('Entry already exists')

# API response messages
class APIResponses:
    """Standardized API response messages."""
    
    @staticmethod
    def success(message_key, data=None):
        """Return success response."""
        return {
            'success': True,
            'message': str(Messages.__dict__.get(message_key, message_key)),
            'data': data
        }
    
    @staticmethod
    def error(message_key, errors=None, status_code=400):
        """Return error response."""
        return {
            'success': False,
            'message': str(Messages.__dict__.get(message_key, message_key)),
            'errors': errors
        }, status_code
    
    @staticmethod
    def not_found(message_key='NOT_FOUND'):
        """Return not found response."""
        return APIResponses.error(message_key, status_code=404)
    
    @staticmethod
    def unauthorized(message_key='UNAUTHORIZED'):
        """Return unauthorized response."""
        return APIResponses.error(message_key, status_code=401)
    
    @staticmethod
    def server_error(message_key='SERVER_ERROR'):
        """Return server error response."""
        return APIResponses.error(message_key, status_code=500)

# Locale management
def set_locale(locale):
    """Set the locale for the current session."""
    if locale in ['en', 'es', 'fr', 'de', 'ar']:
        session['locale'] = locale
        return True
    return False

def get_supported_locales():
    """Get list of supported locales."""
    return ['en', 'es', 'fr', 'de', 'ar']

def get_locale_name(locale_code):
    """Get human-readable locale name."""
    locale_names = {
        'en': 'English',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch',
        'ar': 'العربية'
    }
    return locale_names.get(locale_code, locale_code) 