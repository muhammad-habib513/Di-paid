from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from flask_babel import Babel
from config import Config

# Extensions

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
babel = Babel()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    
    # Initialize Babel with i18n configuration
    from .i18n import init_babel, get_locale, get_timezone
    init_babel(app)
    babel.locale_selector_func = get_locale
    babel.timezone_selector_func = get_timezone
    
    CORS(
     app,
     supports_credentials=True,
     resources={
         r"/api/*": {
             "origins": [
                 "http://localhost:5173",
                 "http://127.0.0.1:5173",
                 "https://di-paid.vercel.app",
                 "https://di-paid-ki8yglz3l-muhammad-habibs-projects-c5f7b7a0.vercel.app"
             ],
         }
     },
    )

    # Register blueprints here (e.g., from .routes import user_bp; app.register_blueprint(user_bp))
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp)
    from .routes.user import user_bp
    app.register_blueprint(user_bp)
    from .routes.group import group_bp
    app.register_blueprint(group_bp)
    from .routes.expense import expense_bp
    app.register_blueprint(expense_bp)
    from .routes.payments import payments_bp
    app.register_blueprint(payments_bp)
    from .routes.notifications import notifications_bp
    app.register_blueprint(notifications_bp)
    from .routes.comments import comments_bp
    app.register_blueprint(comments_bp)
    from .routes.chat import chat_bp
    app.register_blueprint(chat_bp)
    from .routes.reporting import reporting_bp
    app.register_blueprint(reporting_bp)
    from .routes.security import security_bp
    app.register_blueprint(security_bp)
    from .routes.social import social_bp
    app.register_blueprint(social_bp)
    from .routes.analytics import analytics_bp
    app.register_blueprint(analytics_bp)
    from .routes.locale import locale_bp
    app.register_blueprint(locale_bp)
    from .api import api_docs_bp
    app.register_blueprint(api_docs_bp)

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}, 200

    return app 