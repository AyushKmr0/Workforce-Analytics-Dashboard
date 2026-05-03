from extensions import db
from app.models import ActivityLog


def log_activity(user_id, action, details=None):
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))
