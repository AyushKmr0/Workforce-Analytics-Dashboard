from functools import wraps

from flask import jsonify
from flask_jwt_extended import current_user, verify_jwt_in_request

from app.services.attendance_service import get_today_attendance


def role_required(*roles):
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            if not current_user or current_user.role not in roles:
                return jsonify({"message": "Forbidden"}), 403
            if current_user.status != "ACTIVE":
                return jsonify({"message": "Account inactive"}), 403
            return view(*args, **kwargs)

        return wrapper

    return decorator


def is_checked_in():
    record = get_today_attendance(current_user.id)
    return bool(record and record.check_in and not record.check_out)


def require_checked_in_for_change():
    verify_jwt_in_request()
    if not current_user or current_user.status != "ACTIVE":
        return jsonify({"message": "Account inactive"}), 403
    if not is_checked_in():
        return jsonify({"message": "Please check in before making changes."}), 403
    return None
