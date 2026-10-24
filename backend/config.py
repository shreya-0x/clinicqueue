import os
from datetime import timezone
import pytz

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "clinicqueue-production-secure-default-key-2026")
    MONGODB_URI = os.environ.get("MONGODB_URI", "")
    DB_NAME = os.environ.get("DB_NAME", "clinicqueue")
    PORT = int(os.environ.get("PORT", 5000))
    DEBUG = os.environ.get("FLASK_ENV", "development") == "development"
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
    TIMEZONE = os.environ.get("TIMEZONE", "Asia/Kolkata")
    DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() in ("true", "1", "yes")

    @classmethod
    def get_tz(cls):
        try:
            return pytz.timezone(cls.TIMEZONE)
        except Exception:
            return pytz.timezone("Asia/Kolkata")
