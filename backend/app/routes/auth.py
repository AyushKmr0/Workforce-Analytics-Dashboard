from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, current_user, jwt_required
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from app.models import User
from app.schemas.attendance_schema import attendance_payload
from app.schemas.user_schema import user_payload
from app.services.activity_service import log_activity
from app.services.attendance_service import check_in


auth_bp = Blueprint("api_auth", __name__)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password) or user.status != "ACTIVE":
        return jsonify({"message": "Invalid credentials"}), 401

    try:
        user.last_login = datetime.utcnow()
        attendance, checked_in = check_in(user.id)
        log_activity(user.id, "LOGIN", "API login")
        if checked_in:
            log_activity(user.id, "CHECK_IN", "Automatic login check in")
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"message": "Login succeeded, but automatic check-in failed. Please try again."}), 500

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"access_token": token, "user": user_payload(user), "attendance": attendance_payload(attendance)})


@auth_bp.get("/me")
@jwt_required()
def me():
    return jsonify({"user": user_payload(current_user)})


@auth_bp.post("/forgot-password")
def forgot_password():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if user:
        log_activity(user.id, "PASSWORD_RESET_REQUESTED", "API forgot password")
        db.session.commit()
    return jsonify({"message": "If the email exists, a reset request has been recorded."})
