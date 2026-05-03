from config import Config
from extensions import db
from app.models import User


def seed_admin_if_missing():
    email = (Config.ADMIN_SEED_EMAIL or "").lower()
    if not email or not Config.ADMIN_SEED_PASSWORD:
        return
    if User.query.filter_by(email=email).first():
        return
    admin = User(
        name=Config.ADMIN_SEED_NAME or "System Admin",
        email=email,
        role="ADMIN",
        salary=0,
        employee_code=User.generate_employee_code(),
    )
    admin.set_password(Config.ADMIN_SEED_PASSWORD)
    db.session.add(admin)
    db.session.commit()
