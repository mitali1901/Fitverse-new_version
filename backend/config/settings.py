import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fitverse_default_jwt_secret_change_me_in_prod")
    MONGODB_URI = os.getenv("MONGODB_URI", "") or os.getenv("MONGO_URI", "")
    MONGO_URI = MONGODB_URI
    DB_NAME = os.getenv("DB_NAME", "fitverse")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    PORT = int(os.getenv("PORT", 5000))
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    JWT_EXPIRATION_DAYS = 7

    # SMTP Email Configuration
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USERNAME", "no-reply@fitverse.com"))
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "yes")

