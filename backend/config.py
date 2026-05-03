import os
from datetime import timedelta
from urllib.parse import quote_plus, urlencode

from dotenv import load_dotenv


load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    ORACLE_USER = os.getenv("ORACLE_USER", "")
    ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD", "")
    ORACLE_DSN = os.getenv("ORACLE_DSN", "")

    ADMIN_SEED_EMAIL = os.getenv("ADMIN_SEED_EMAIL", "")
    ADMIN_SEED_PASSWORD = os.getenv("ADMIN_SEED_PASSWORD", "")
    ADMIN_SEED_NAME = os.getenv("ADMIN_SEED_NAME", "System Admin")

    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER", os.path.join(os.path.dirname(__file__), "uploads")
    )
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(8 * 1024 * 1024)))
    CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "")

    @staticmethod
    def build_db_uri(user, password, dsn):
        user_enc = quote_plus(user)
        password_enc = quote_plus(password)
        dsn_clean = dsn.strip()
        if "/" in dsn_clean and "?" not in dsn_clean:
            host_port, service_name = dsn_clean.rsplit("/", 1)
            query = urlencode({"service_name": service_name})
            return f"oracle+oracledb://{user_enc}:{password_enc}@{host_port}/?{query}"
        return f"oracle+oracledb://{user_enc}:{password_enc}@{dsn_clean}"

    SQLALCHEMY_DATABASE_URI = build_db_uri(ORACLE_USER, ORACLE_PASSWORD, ORACLE_DSN)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
