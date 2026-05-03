from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user
from sqlalchemy import asc, desc, func, or_

from extensions import db
from app.models import Attendance, Document, Leave, ProfileChangeRequest, User
from app.schemas.attendance_schema import attendance_payload
from app.schemas.document_schema import document_payload
from app.schemas.leave_schema import leave_payload
from app.schemas.profile_change_schema import profile_change_payload
from app.schemas.user_schema import user_payload
from app.services.activity_service import log_activity
from app.services.analytics_service import get_analytics_payload
from app.services.attendance_report_service import attendance_report, requested_days
from app.services.work_report_service import requested_days as requested_work_days
from app.services.work_report_service import team_work_report
from app.utils.security import require_checked_in_for_change, role_required


hr_bp = Blueprint("api_hr", __name__)


@hr_bp.before_request
def require_attendance_for_changes():
    if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return None
    return require_checked_in_for_change()


@hr_bp.get("/analytics")
@role_required("HR")
def analytics():
    return jsonify(get_analytics_payload(current_user.department_id))


@hr_bp.get("/employees")
@role_required("HR")
def employees():
    search = (request.args.get("search") or "").strip().lower()
    sort = request.args.get("sort", "name")
    direction = request.args.get("direction", "asc")
    query = User.query.filter(User.department_id == current_user.department_id)
    query = query.filter(User.role != "ADMIN", User.id != current_user.id)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                func.lower(User.name).like(like),
                func.lower(User.email).like(like),
                func.lower(User.employee_code).like(like),
            )
        )
    sort_column = User.salary if sort == "salary" else User.name
    query = query.order_by((desc if direction == "desc" else asc)(sort_column))
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(request.args.get("per_page", 30, type=int), 100)
    result = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "items": [user_payload(user) for user in result.items],
            "total": result.total,
            "page": result.page,
            "pages": result.pages,
        }
    )


@hr_bp.get("/leaves")
@role_required("HR")
def leaves():
    items = (
        Leave.query.join(User, Leave.user_id == User.id)
        .filter(User.department_id == current_user.department_id)
        .order_by(Leave.start_date.desc())
        .limit(100)
        .all()
    )
    return jsonify({"items": [leave_payload(item) for item in items]})


@hr_bp.get("/documents")
@role_required("HR")
def documents():
    items = (
        Document.query.join(User, Document.user_id == User.id)
        .filter(User.department_id == current_user.department_id, User.role == "EMPLOYEE")
        .order_by(Document.uploaded_at.desc())
        .limit(200)
        .all()
    )
    return jsonify({"items": [document_payload(item) | {"employee": user_payload(item.user)} for item in items]})


@hr_bp.delete("/documents/<int:document_id>")
@role_required("HR")
def delete_document(document_id):
    document = (
        Document.query.join(User, Document.user_id == User.id)
        .filter(Document.id == document_id, User.department_id == current_user.department_id, User.role == "EMPLOYEE")
        .first_or_404()
    )
    log_activity(current_user.id, "DELETE_DOCUMENT", f"Deleted document #{document.id}")
    db.session.delete(document)
    db.session.commit()
    return jsonify({"message": "Document deleted."})


@hr_bp.get("/attendance")
@role_required("HR")
def attendance():
    days = requested_days(request.args.get("days"))
    users = User.query.filter(
        User.department_id == current_user.department_id,
        User.status == "ACTIVE",
        User.role != "ADMIN",
        User.id != current_user.id,
    )
    return jsonify(attendance_report(users, days))


@hr_bp.get("/work-reports")
@role_required("HR")
def work_reports():
    days = requested_work_days(request.args.get("days"))
    users = User.query.filter(
        User.department_id == current_user.department_id,
        User.status == "ACTIVE",
        User.role == "EMPLOYEE",
    )
    return jsonify(team_work_report(users, days))


@hr_bp.patch("/leaves/<int:leave_id>")
@role_required("HR")
def review_leave(leave_id):
    leave = (
        Leave.query.join(User, Leave.user_id == User.id)
        .filter(Leave.id == leave_id, User.department_id == current_user.department_id)
        .first_or_404()
    )
    status = ((request.get_json(silent=True) or {}).get("status") or "").upper()
    if status not in {"APPROVED", "REJECTED"}:
        return jsonify({"message": "Status must be APPROVED or REJECTED."}), 400
    leave.status = status
    leave.approved_by = current_user.id
    log_activity(current_user.id, f"{status}_LEAVE", f"Leave #{leave.id}")
    db.session.commit()
    return jsonify({"leave": leave_payload(leave)})


@hr_bp.get("/profile-change-requests")
@role_required("HR")
def profile_change_requests():
    items = (
        ProfileChangeRequest.query.join(User, ProfileChangeRequest.user_id == User.id)
        .filter(
            User.department_id == current_user.department_id,
            User.role == "EMPLOYEE",
            ProfileChangeRequest.status == "PENDING_HR",
        )
        .order_by(ProfileChangeRequest.created_at.asc())
        .limit(100)
        .all()
    )
    return jsonify({"items": [profile_change_payload(item) for item in items]})


@hr_bp.patch("/profile-change-requests/<int:request_id>")
@role_required("HR")
def review_profile_change_request(request_id):
    request_item = (
        ProfileChangeRequest.query.join(User, ProfileChangeRequest.user_id == User.id)
        .filter(
            ProfileChangeRequest.id == request_id,
            User.department_id == current_user.department_id,
            User.role == "EMPLOYEE",
            ProfileChangeRequest.status == "PENDING_HR",
        )
        .first_or_404()
    )
    decision = ((request.get_json(silent=True) or {}).get("status") or "").upper()
    if decision == "APPROVED":
        request_item.status = "PENDING_ADMIN"
        request_item.hr_reviewed_by = current_user.id
    elif decision == "REJECTED":
        request_item.status = "REJECTED"
        request_item.hr_reviewed_by = current_user.id
    else:
        return jsonify({"message": "Status must be APPROVED or REJECTED."}), 400
    log_activity(current_user.id, "PROFILE_CHANGE_HR_REVIEW", request_item.status)
    db.session.commit()
    return jsonify({"request": profile_change_payload(request_item)})
