from flask import Flask, jsonify
from flask_cors import CORS
from config.settings import Config
from app.utils.db import Database

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable Cross-Origin Resource Sharing
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Connect to Database (MongoDB Atlas with fallback)
    Database.connect()

    # Register API Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.yoga_routes import yoga_bp
    from app.routes.assistant_routes import assistant_bp
    from app.routes.diet_routes import diet_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(yoga_bp, url_prefix="/api/yoga")
    app.register_blueprint(assistant_bp, url_prefix="/api/assistant")
    app.register_blueprint(diet_bp, url_prefix="/api/diet")

    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "success": True,
            "message": "Welcome to FitVerse Backend API",
            "service": "FitVerse Backend API",
            "version": "1.0.0",
            "database_mode": "MongoDB Atlas" if Database.is_atlas else "Local Storage Fallback",
            "endpoints": {
                "health": "/api/health",
                "auth": "/api/auth/*",
                "users": "/api/users/*",
                "yoga": "/api/yoga/*",
                "assistant": "/api/assistant/*"
            }
        }), 200

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "FitVerse Backend API",
            "version": "1.0.0",
            "database_mode": "MongoDB Atlas" if Database.is_atlas else "Local Storage Fallback"
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found."}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "error": "Internal server error."}), 500

    return app

