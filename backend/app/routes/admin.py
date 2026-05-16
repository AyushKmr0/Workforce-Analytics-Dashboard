from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user
from sqlalchemy import func, or_

from extensions import db
from app.models import Attendance, Department, Document, Leave, ProfileChangeRequest, User
from app.schemas.attendance_schema import attendance_payload
from app.schemas.document_schema import document_payload
from app.schemas.leave_schema import leave_payload
from app.schemas.profile_change_schema import profile_change_payload
from app.schemas.user_schema import department_payload, user_payload
from app.services.activity_service import log_activity
from app.services.analytics_service import get_analytics_payload, requested_analytics_days
from app.services.attendance_report_service import attendance_report, requested_days
from app.services.file_service import save_upload
from app.services.profile_change_service import apply_profile_changes
from app.services.work_report_service import requested_days as requested_work_days
from app.services.work_report_service import team_work_report
from app.utils.dates import parse_date
from app.utils.security import require_checked_in_for_change, role_required


admin_bp = Blueprint("api_admin", __name__)


def clean_optional(value):
    return (value or "").strip() or None


@admin_bp.before_request
def require_attendance_for_changes():
    if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return None
    return require_checked_in_for_change()


@admin_bp.get("/analytics")
@role_required("ADMIN")
def analytics():
    department_id = request.args.get("department_id", type=int)
    days = requested_analytics_days(request.args.get("days"))
    return jsonify(get_analytics_payload(department_id, days))


@admin_bp.get("/employees")
@role_required("ADMIN")
def employees():
    search = (request.args.get("search") or "").strip().lower()
    department_id = request.args.get("department_id", type=int)
    role = (request.args.get("role") or "").strip().upper()
    query = User.query.filter(User.id != current_user.id)
    if department_id:
        query = query.filter(User.department_id == department_id)
    if role:
        if role not in {"EMPLOYEE", "HR", "ADMIN"}:
            return jsonify({"message": "Invalid role filter."}), 400
        query = query.filter(User.role == role)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                func.lower(User.name).like(like),
                func.lower(User.email).like(like),
                func.lower(User.employee_code).like(like),
            )
        )
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(request.args.get("per_page", 30, type=int), 100)
    result = query.order_by(User.name.asc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "items": [user_payload(user) for user in result.items],
            "total": result.total,
            "page": result.page,
            "pages": result.pages,
        }
    )


@admin_bp.post("/employees")
@role_required("ADMIN")
def create_employee():
    data = request.form if request.form else (request.get_json(silent=True) or {})
    required = [
        "name",
        "email",
        "password",
        "role",
        "department_id",
        "salary",
        "phone_number",
        "status",
        "date_of_birth",
        "joining_date",
        "address",
        "city",
        "district",
        "state",
        "pincode",
    ]
    if any(not data.get(field) for field in required):
        return jsonify({"message": "All employee fields are required."}), 400
    if not request.files.get("profile_image") or not request.files.get("document"):
        return jsonify({"message": "Profile image and employee document are required."}), 400
    if User.query.filter_by(email=data["email"].strip().lower()).first():
        return jsonify({"message": "Email already exists."}), 409
    try:
        department = db.session.get(Department, int(data.get("department_id"))) if data.get("department_id") else None
        salary = Decimal(str(data.get("salary") or 0))
        user = User(
            employee_code=User.generate_employee_code(
                department.name if department else None
            ),
            name=data["name"].strip(),
            email=data["email"].strip().lower(),
            role=(data.get("role") or "EMPLOYEE").upper(),
            salary=salary,
            department_id=data.get("department_id") or None,
            phone_number=clean_optional(data.get("phone_number")),
            address=clean_optional(data.get("address")),
            city=clean_optional(data.get("city")),
            district=clean_optional(data.get("district")),
            state=clean_optional(data.get("state")),
            pincode=clean_optional(data.get("pincode")),
            date_of_birth=parse_date(data.get("date_of_birth")),
            joining_date=parse_date(data.get("joining_date")),
            status=(data.get("status") or "ACTIVE").upper(),
        )
    except (InvalidOperation, ValueError):
        return jsonify({"message": "Invalid employee payload."}), 400

    if user.role not in {"EMPLOYEE", "HR", "ADMIN"} or user.status not in {"ACTIVE", "INACTIVE"}:
        return jsonify({"message": "Invalid role or status."}), 400

    user.set_password(data["password"])
    try:
        upload = save_upload(request.files["profile_image"], "profiles")
        user.profile_image = upload["file_url"]
        db.session.add(user)
        db.session.flush()
        upload = save_upload(request.files["document"], "documents")
        db.session.add(Document(user_id=user.id, file_url=upload["file_url"], file_type=upload["file_type"]))
    except ValueError as exc:
        db.session.rollback()
        return jsonify({"message": str(exc)}), 400
    log_activity(current_user.id, "CREATE_USER", f"Created {user.email}")
    db.session.commit()
    return jsonify({"user": user_payload(user)}), 201


@admin_bp.put("/employees/<int:user_id>")
@role_required("ADMIN")
def update_employee(user_id):
    user = User.query.get_or_404(user_id)
    data = request.form if request.form else (request.get_json(silent=True) or {})
    incoming_email = data.get("email", user.email).strip().lower()
    if User.query.filter(User.email == incoming_email, User.id != user.id).first():
        return jsonify({"message": "Email already exists."}), 409
    try:
        user.name = data.get("name", user.name).strip()
        user.email = incoming_email
        user.role = (data.get("role") or user.role).upper()
        user.salary = Decimal(str(data.get("salary", user.salary)))
        user.department_id = data.get("department_id", user.department_id) or None
        if "phone_number" in data:
            user.phone_number = clean_optional(data.get("phone_number"))
        if "address" in data:
            user.address = clean_optional(data.get("address"))
        if "city" in data:
            user.city = clean_optional(data.get("city"))
        if "district" in data:
            user.district = clean_optional(data.get("district"))
        if "state" in data:
            user.state = clean_optional(data.get("state"))
        if "pincode" in data:
            user.pincode = clean_optional(data.get("pincode"))
        user.date_of_birth = parse_date(data.get("date_of_birth")) if "date_of_birth" in data else user.date_of_birth
        user.joining_date = parse_date(data.get("joining_date")) if "joining_date" in data else user.joining_date
        user.status = (data.get("status") or user.status).upper()
    except (InvalidOperation, ValueError):
        return jsonify({"message": "Invalid employee payload."}), 400

    if user.role not in {"EMPLOYEE", "HR", "ADMIN"} or user.status not in {"ACTIVE", "INACTIVE"}:
        return jsonify({"message": "Invalid role or status."}), 400
    if data.get("password"):
        user.set_password(data.get("password"))

    try:
        if request.files.get("profile_image"):
            upload = save_upload(request.files["profile_image"], "profiles")
            user.profile_image = upload["file_url"]
        if request.files.get("document"):
            upload = save_upload(request.files["document"], "documents")
            db.session.add(Document(user_id=user.id, file_url=upload["file_url"], file_type=upload["file_type"]))
    except ValueError as exc:
        db.session.rollback()
        return jsonify({"message": str(exc)}), 400
    log_activity(current_user.id, "UPDATE_USER", f"Updated {user.email}")
    db.session.commit()
    return jsonify({"user": user_payload(user)})


@admin_bp.delete("/employees/<int:user_id>")
@role_required("ADMIN")
def delete_employee(user_id):
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        return jsonify({"message": "You cannot delete your own account."}), 400
    log_activity(current_user.id, "DELETE_USER", f"Deleted {user.email}")
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Employee deleted."})


@admin_bp.get("/departments")
@role_required("ADMIN")
def departments():
    items = Department.query.order_by(Department.name.asc()).all()
    return jsonify({"items": [department_payload(item) for item in items]})


@admin_bp.post("/departments")
@role_required("ADMIN")
def create_department():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "Department name is required."}), 400
    if Department.query.filter_by(name=name).first():
        return jsonify({"message": "Department already exists."}), 409
    department = Department(name=name)
    db.session.add(department)
    log_activity(current_user.id, "CREATE_DEPARTMENT", name)
    db.session.commit()
    return jsonify({"department": department_payload(department)}), 201


@admin_bp.put("/departments/<int:department_id>")
@role_required("ADMIN")
def update_department(department_id):
    department = Department.query.get_or_404(department_id)
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "Department name is required."}), 400
    if Department.query.filter(Department.name == name, Department.id != department.id).first():
        return jsonify({"message": "Department already exists."}), 409
    old_name = department.name
    department.name = name
    log_activity(current_user.id, "UPDATE_DEPARTMENT", f"{old_name} -> {name}")
    db.session.commit()
    return jsonify({"department": department_payload(department)})


@admin_bp.delete("/departments/<int:department_id>")
@role_required("ADMIN")
def delete_department(department_id):
    department = Department.query.get_or_404(department_id)
    name = department.name
    User.query.filter(User.department_id == department.id).update({"department_id": None})
    log_activity(current_user.id, "DELETE_DEPARTMENT", name)
    db.session.delete(department)
    db.session.commit()
    return jsonify({"message": "Department deleted."})


@admin_bp.get("/leaves")
@role_required("ADMIN")
def leaves():
    items = Leave.query.order_by(Leave.start_date.desc()).limit(100).all()
    return jsonify({"items": [leave_payload(item) for item in items]})


@admin_bp.get("/documents")
@role_required("ADMIN")
def documents():
    items = Document.query.order_by(Document.uploaded_at.desc()).limit(200).all()
    return jsonify({"items": [document_payload(item) | {"employee": user_payload(item.user)} for item in items]})


@admin_bp.delete("/documents/<int:document_id>")
@role_required("ADMIN")
def delete_document(document_id):
    document = Document.query.get_or_404(document_id)
    log_activity(current_user.id, "DELETE_DOCUMENT", f"Deleted document #{document.id}")
    db.session.delete(document)
    db.session.commit()
    return jsonify({"message": "Document deleted."})


@admin_bp.get("/attendance")
@role_required("ADMIN")
def attendance():
    days = requested_days(request.args.get("days"))
    department_id = request.args.get("department_id", type=int)
    users = User.query.filter(User.status == "ACTIVE", User.role != "ADMIN")
    if department_id:
        users = users.filter(User.department_id == department_id)
    return jsonify(attendance_report(users, days))


@admin_bp.get("/work-reports")
@role_required("ADMIN")
def work_reports():
    days = requested_work_days(request.args.get("days"))
    department_id = request.args.get("department_id", type=int)
    users = User.query.filter(User.status == "ACTIVE", User.role == "EMPLOYEE")
    if department_id:
        users = users.filter(User.department_id == department_id)
    return jsonify(team_work_report(users, days))


@admin_bp.patch("/leaves/<int:leave_id>")
@role_required("ADMIN")
def review_leave(leave_id):
    leave = Leave.query.get_or_404(leave_id)
    status = ((request.get_json(silent=True) or {}).get("status") or "").upper()
    if status not in {"APPROVED", "REJECTED"}:
        return jsonify({"message": "Status must be APPROVED or REJECTED."}), 400
    leave.status = status
    leave.approved_by = current_user.id
    log_activity(current_user.id, f"{status}_LEAVE", f"Leave #{leave.id}")
    db.session.commit()
    return jsonify({"leave": leave_payload(leave)})


@admin_bp.get("/profile-change-requests")
@role_required("ADMIN")
def profile_change_requests():
    items = (
        ProfileChangeRequest.query.filter(ProfileChangeRequest.status == "PENDING_ADMIN")
        .order_by(ProfileChangeRequest.created_at.asc())
        .limit(100)
        .all()
    )
    return jsonify({"items": [profile_change_payload(item) for item in items]})


@admin_bp.patch("/profile-change-requests/<int:request_id>")
@role_required("ADMIN")
def review_profile_change_request(request_id):
    request_item = ProfileChangeRequest.query.filter_by(id=request_id, status="PENDING_ADMIN").first_or_404()
    decision = ((request.get_json(silent=True) or {}).get("status") or "").upper()
    if decision == "APPROVED":
        changes = profile_change_payload(request_item)["requested_changes"]
        if "email" in changes:
            incoming_email = (changes.get("email") or "").strip().lower()
            if User.query.filter(User.email == incoming_email, User.id != request_item.user_id).first():
                return jsonify({"message": "Email already exists."}), 409
            changes["email"] = incoming_email
        apply_profile_changes(request_item.user, changes, parse_date)
        request_item.status = "APPROVED"
        request_item.admin_reviewed_by = current_user.id
    elif decision == "REJECTED":
        request_item.status = "REJECTED"
        request_item.admin_reviewed_by = current_user.id
    else:
        return jsonify({"message": "Status must be APPROVED or REJECTED."}), 400
    log_activity(current_user.id, "PROFILE_CHANGE_ADMIN_REVIEW", request_item.status)
    db.session.commit()
    return jsonify({"request": profile_change_payload(request_item)})
