from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.i18n import set_locale, get_supported_locales, get_locale_name, get_translated_text

locale_bp = Blueprint('locale', __name__, url_prefix='/api/locale')

@locale_bp.route('/set', methods=['POST'])
@jwt_required()
def set_user_locale():
    """Set the locale for the current user session."""
    try:
        data = request.get_json()
        locale = data.get('locale')
        
        if not locale:
            return jsonify({
                'success': False,
                'message': get_translated_text('Missing required fields'),
                'error': 'Locale is required'
            }), 400
        
        if set_locale(locale):
            return jsonify({
                'success': True,
                'message': get_translated_text('Locale updated successfully'),
                'locale': locale,
                'locale_name': get_locale_name(locale)
            })
        else:
            return jsonify({
                'success': False,
                'message': get_translated_text('Invalid locale'),
                'error': 'Unsupported locale'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': get_translated_text('Server error'),
            'error': str(e)
        }), 500

@locale_bp.route('/supported', methods=['GET'])
def get_supported_locales_list():
    """Get list of supported locales."""
    try:
        locales = get_supported_locales()
        locale_data = []
        
        for locale in locales:
            locale_data.append({
                'code': locale,
                'name': get_locale_name(locale)
            })
        
        return jsonify({
            'success': True,
            'locales': locale_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': get_translated_text('Server error'),
            'error': str(e)
        }), 500

@locale_bp.route('/current', methods=['GET'])
def get_current_locale():
    """Get current locale information."""
    try:
        current_locale = session.get('locale', 'en')
        
        return jsonify({
            'success': True,
            'locale': current_locale,
            'locale_name': get_locale_name(current_locale)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': get_translated_text('Server error'),
            'error': str(e)
        }), 500 