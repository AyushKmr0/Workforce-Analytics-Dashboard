from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from app.models import Attendance, Document, Leave, ProfileChangeRequest, User, WorkReport
from app.schemas.attendance_schema import attendance_payload
from app.schemas.document_schema import document_payload
from app.schemas.leave_schema import leave_payload
from app.schemas.profile_change_schema import profile_change_payload
from app.schemas.user_schema import user_payload
from app.schemas.work_report_schema import work_report_payload
from app.services.activity_service import log_activity
from app.services.attendance_service import check_in, check_out, get_today_attendance
from app.services.file_service import save_upload
from app.services.profile_change_service import clean_profile_changes, encoded_changes
from app.utils.dates import parse_date
from app.utils.security import require_checked_in_for_change, role_required


employee_bp = Blueprint("api_employee", __name__)


@employee_bp.before_request
def require_attendance_for_changes():
    if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return None
    if request.endpoint in {
        "api_employee.attendance_check_in",
        "api_employee.attendance_check_out",
    }:
        return None
    return require_checked_in_for_change()


@employee_bp.get("/dashboard")
@role_required("EMPLOYEE", "HR", "ADMIN")
def dashboard():
    leaves = (
        Leave.query.filter_by(user_id=current_user.id)
        .order_by(Leave.start_date.desc())
        .limit(10)
        .all()
    )
    documents = (
        Document.query.filter_by(user_id=current_user.id)
        .order_by(Document.uploaded_at.desc())
        .limit(10)
        .all()
    )
    return jsonify(
        {
            "user": user_payload(current_user),
            "attendance": attendance_payload(get_today_attendance(current_user.id)),
            "leaves": [leave_payload(item) for item in leaves],
            "documents": [document_payload(item) for item in documents],
        }
    )


@employee_bp.patch("/profile")
@role_required("EMPLOYEE", "HR", "ADMIN")
def update_profile():
    data = request.form if request.form else (request.get_json(silent=True) or {})
    incoming_email = (data.get("email") or current_user.email).strip().lower()
    if User.query.filter(User.email == incoming_email, User.id != current_user.id).first():
        return jsonify({"message": "Email already exists."}), 409

    try:
        if "name" in data:
            current_user.name = (data.get("name") or "").strip() or current_user.name
        current_user.email = incoming_email
        if "phone_number" in data:
            current_user.phone_number = (data.get("phone_number") or "").strip() or None
        if "address" in data:
            current_user.address = (data.get("address") or "").strip() or None
        if "date_of_birth" in data:
            current_user.date_of_birth = parse_date(data.get("date_of_birth")) if data.get("date_of_birth") else None
        if "joining_date" in data:
            current_user.joining_date = parse_date(data.get("joining_date")) if data.get("joining_date") else None
        if request.files.get("profile_image"):
            upload = save_upload(request.files["profile_image"], "profiles")
            current_user.profile_image = upload["file_url"]
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400

    log_activity(current_user.id, "UPDATE_OWN_PROFILE", "Self-service profile update")
    db.session.commit()
    return jsonify({"user": user_payload(current_user)})


@employee_bp.patch("/password")
@role_required("EMPLOYEE", "HR", "ADMIN")
def update_password():
    data = request.get_json(silent=True) or {}
    password = data.get("password") or ""
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters."}), 400
    current_user.set_password(password)
    log_activity(current_user.id, "UPDATE_OWN_PASSWORD", "Self-service password update")
    db.session.commit()
    return jsonify({"message": "Password updated successfully."})


@employee_bp.get("/attendance/today")
@role_required("EMPLOYEE", "HR", "ADMIN")
def today_attendance():
    return jsonify({"attendance": attendance_payload(get_today_attendance(current_user.id))})


@employee_bp.post("/attendance/check-in")
@role_required("EMPLOYEE", "HR", "ADMIN")
def attendance_check_in():
    data = request.get_json(silent=True) or {}
    if not current_user.check_password(data.get("password") or ""):
        return jsonify({"message": "Password verification failed."}), 403
    try:
        record, created = check_in(current_user.id)
        if not created:
            return jsonify({"message": "Already checked in.", "attendance": attendance_payload(record)}), 400
        log_activity(current_user.id, "CHECK_IN", "API check in")
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"message": "Unable to save check-in. Please try again."}), 500
    return jsonify({"attendance": attendance_payload(record)})


@employee_bp.get("/attendance")
@role_required("EMPLOYEE", "HR", "ADMIN")
def attendance_history():
    items = (
        Attendance.query.filter_by(user_id=current_user.id)
        .order_by(Attendance.date.desc())
        .limit(60)
        .all()
    )
    return jsonify({"items": [attendance_payload(item) for item in items]})


@employee_bp.post("/attendance/check-out")
@role_required("EMPLOYEE", "HR", "ADMIN")
def attendance_check_out():
    data = request.get_json(silent=True) or {}
    if not current_user.check_password(data.get("password") or ""):
        return jsonify({"message": "Password verification failed."}), 403
    try:
        record, updated = check_out(current_user.id)
        if not updated:
            return jsonify({"message": "Check-out requires a valid check-in."}), 400
        log_activity(current_user.id, "CHECK_OUT", "API check out")
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"message": "Unable to save check-out. Please try again."}), 500
    return jsonify({"attendance": attendance_payload(record)})


@employee_bp.post("/leaves")
@role_required("EMPLOYEE")
def apply_leave():
    data = request.get_json(silent=True) or {}
    try:
        start_date = parse_date(data.get("start_date"), required=True)
        end_date = parse_date(data.get("end_date"), required=True)
    except ValueError:
        return jsonify({"message": "Valid start_date and end_date are required."}), 400
    if end_date < start_date:
        return jsonify({"message": "end_date cannot be before start_date."}), 400
    leave = Leave(
        user_id=current_user.id,
        leave_type=(data.get("leave_type") or "Casual").strip(),
        start_date=start_date,
        end_date=end_date,
        reason=(data.get("reason") or "").strip() or None,
    )
    db.session.add(leave)
    log_activity(current_user.id, "APPLY_LEAVE", f"{start_date} to {end_date}")
    db.session.commit()
    return jsonify({"leave": leave_payload(leave)}), 201


@employee_bp.post("/documents")
@role_required("EMPLOYEE", "HR", "ADMIN")
def upload_document():
    try:
        upload = save_upload(request.files.get("document"), "documents")
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    if not upload:
        return jsonify({"message": "Document is required."}), 400
    document = Document(
        user_id=current_user.id,
        file_url=upload["file_url"],
        file_type=upload["file_type"],
    )
    db.session.add(document)
    log_activity(current_user.id, "UPLOAD_DOCUMENT", upload["file_type"])
    db.session.commit()
    return jsonify({"document": document_payload(document)}), 201


@employee_bp.delete("/documents/<int:document_id>")
@role_required("EMPLOYEE", "HR", "ADMIN")
def delete_document(document_id):
    document = Document.query.filter_by(id=document_id, user_id=current_user.id).first_or_404()
    log_activity(current_user.id, "DELETE_DOCUMENT", f"Deleted document #{document.id}")
    db.session.delete(document)
    db.session.commit()
    return jsonify({"message": "Document deleted."})


@employee_bp.post("/work-reports")
@role_required("EMPLOYEE")
def submit_work_report():
    data = request.get_json(silent=True) or {}
    try:
        report_date = parse_date(data.get("report_date"), required=True)
        completion_percent = int(data.get("completion_percent", 0))
    except (TypeError, ValueError):
        return jsonify({"message": "Valid report_date and completion_percent are required."}), 400
    completed_work = (data.get("completed_work") or "").strip()
    pending_work = (data.get("pending_work") or "").strip() or None
    if not completed_work:
        return jsonify({"message": "Completed work is required."}), 400
    if completion_percent < 0 or completion_percent > 100:
        return jsonify({"message": "Completion percent must be between 0 and 100."}), 400

    report = WorkReport.query.filter_by(user_id=current_user.id, report_date=report_date).first()
    if report:
        report.completed_work = completed_work
        report.pending_work = pending_work
        report.completion_percent = completion_percent
    else:
        report = WorkReport(
            user_id=current_user.id,
            report_date=report_date,
            completed_work=completed_work,
            pending_work=pending_work,
            completion_percent=completion_percent,
        )
        db.session.add(report)
    log_activity(current_user.id, "SUBMIT_WORK_REPORT", str(report_date))
    db.session.commit()
    return jsonify({"work_report": work_report_payload(report)}), 201


@employee_bp.get("/profile-change-requests")
@role_required("EMPLOYEE", "HR", "ADMIN")
def my_profile_change_requests():
    items = (
        ProfileChangeRequest.query.filter_by(user_id=current_user.id)
        .order_by(ProfileChangeRequest.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify({"items": [profile_change_payload(item) for item in items]})


@employee_bp.post("/profile-change-requests")
@role_required("EMPLOYEE", "HR")
def submit_profile_change_request():
    changes = clean_profile_changes(request.get_json(silent=True) or {})
    if not changes:
        return jsonify({"message": "No valid profile changes were submitted."}), 400
    status = "PENDING_ADMIN" if current_user.role == "HR" else "PENDING_HR"
    request_item = ProfileChangeRequest(
        user_id=current_user.id,
        requested_changes=encoded_changes(changes),
        status=status,
    )
    db.session.add(request_item)
    log_activity(current_user.id, "PROFILE_CHANGE_REQUEST", status)
    db.session.commit()
    return jsonify({"request": profile_change_payload(request_item)}), 201
