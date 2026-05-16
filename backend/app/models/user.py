from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, db.Identity(start=1), primary_key=True)
    employee_code = db.Column(db.String(8), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    salary = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="SET NULL"))
    role = db.Column(db.String(20), nullable=False, index=True)
    phone_number = db.Column(db.String(30))
    address = db.Column(db.String(500))
    city = db.Column(db.String(80))
    district = db.Column(db.String(80))
    state = db.Column(db.String(80))
    pincode = db.Column(db.String(12))
    date_of_birth = db.Column(db.Date)
    joining_date = db.Column(db.Date)
    profile_image = db.Column(db.String(500))
    status = db.Column(db.String(20), nullable=False, default="ACTIVE", index=True)
    last_login = db.Column(db.DateTime)

    department = db.relationship("Department", back_populates="users", lazy="joined")
    attendance_records = db.relationship(
        "Attendance", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )
    leave_requests = db.relationship(
        "Leave",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Leave.user_id",
        lazy="dynamic",
    )
    documents = db.relationship(
        "Document", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )
    work_reports = db.relationship(
        "WorkReport", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )
    activity_logs = db.relationship(
        "ActivityLog", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )

    __table_args__ = (
        db.CheckConstraint("role IN ('EMPLOYEE','HR','ADMIN')", name="api_ck_users_role"),
        db.CheckConstraint("status IN ('ACTIVE','INACTIVE')", name="api_ck_users_status"),
    )

    def set_password(self, raw_password):
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password, raw_password)

    @staticmethod
    def code_prefix(department_name):
        letters = "".join(ch for ch in (department_name or "UNASSIGNED").upper() if ch.isalpha())
        return (letters + "XX")[:2]

    @staticmethod
    def generate_employee_code(department_name=None):
        prefix = User.code_prefix(department_name)
        latest = (
            db.session.query(User.employee_code)
            .filter(User.employee_code.like(f"{prefix}%"))
            .order_by(User.employee_code.desc())
            .first()
        )
        next_number = 1
        if latest and latest[0] and len(latest[0]) >= 8 and latest[0][2:].isdigit():
            next_number = int(latest[0][2:]) + 1
        while next_number <= 999999:
            code = f"{prefix}{next_number:06d}"
            if not db.session.execute(db.select(User.id).filter_by(employee_code=code)).first():
                return code
            next_number += 1
        raise ValueError("No employee codes available for this department.")
