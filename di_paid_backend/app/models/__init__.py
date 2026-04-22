from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    # ... your other setup ...
    CORS(app, supports_credentials=True)
    # ... rest of your code ...
    return app 