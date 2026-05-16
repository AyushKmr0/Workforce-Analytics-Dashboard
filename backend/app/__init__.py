from flask import Flask, jsonify
import cloudinary
from sqlalchemy import text

from config import Config
from extensions import cors, db, jwt
from app.models import User
from app.routes.admin import admin_bp
from app.routes.auth import auth_bp
from app.routes.employee import employee_bp
from app.routes.hr import hr_bp
from app.services.seed_service import seed_admin_if_missing


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    if app.config.get("CLOUDINARY_URL"):
        cloudinary.config(cloudinary_url=app.config["CLOUDINARY_URL"], secure=True)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    )

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(hr_bp, url_prefix="/api/hr")
    app.register_blueprint(employee_bp, url_prefix="/api/employee")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @jwt.user_lookup_loader
    def load_user(_jwt_header, jwt_data):
        return db.session.get(User, int(jwt_data["sub"]))

    with app.app_context():
        db.create_all()
        ensure_api_schema()
        seed_admin_if_missing()

    return app


def ensure_api_schema():
    ensure_user_columns()
    normalize_status_values()
    replace_check_constraint(
        "ATTENDANCE",
        "API_CK_ATTENDANCE_STATUS",
        "status IN ('PRESENT','ABSENT','HALF_DAY','ON_LEAVE')",
        ["CK_ATTENDANCE_STATUS", "API_CK_ATTENDANCE_STATUS"],
    )
    replace_check_constraint(
        "LEAVES",
        "API_CK_LEAVES_STATUS",
        "status IN ('PENDING','APPROVED','REJECTED')",
        ["CK_LEAVE_STATUS", "API_CK_LEAVES_STATUS"],
    )


def ensure_user_columns():
    ensure_column_exists("USERS", "CITY", "VARCHAR2(80)")
    ensure_column_exists("USERS", "DISTRICT", "VARCHAR2(80)")
    ensure_column_exists("USERS", "STATE", "VARCHAR2(80)")
    ensure_column_exists("USERS", "PINCODE", "VARCHAR2(12)")
    db.session.execute(text("ALTER TABLE users MODIFY employee_code VARCHAR2(8)"))
    db.session.commit()


def ensure_column_exists(table_name, column_name, column_type):
    exists = db.session.execute(
        text(
            """
            SELECT 1
            FROM user_tab_columns
            WHERE table_name = :table_name
              AND column_name = :column_name
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).first()
    if exists:
        return
    db.session.execute(text(f"ALTER TABLE {table_name.lower()} ADD {column_name.lower()} {column_type}"))
    db.session.commit()


def normalize_status_values():
    db.session.execute(
        text(
            """
            UPDATE attendance
            SET status = CASE status
                WHEN 'Present' THEN 'PRESENT'
                WHEN 'Late' THEN 'HALF_DAY'
                WHEN 'Absent' THEN 'ABSENT'
                ELSE status
            END
            WHERE status IN ('Present', 'Late', 'Absent')
            """
        )
    )
    db.session.execute(
        text(
            """
            UPDATE leaves
            SET status = CASE status
                WHEN 'Pending' THEN 'PENDING'
                WHEN 'Approved' THEN 'APPROVED'
                WHEN 'Rejected' THEN 'REJECTED'
                ELSE status
            END
            WHERE status IN ('Pending', 'Approved', 'Rejected')
            """
        )
    )
    db.session.commit()


def replace_check_constraint(table_name, constraint_name, condition, old_constraint_names):
    existing = {
        row[0].upper()
        for row in db.session.execute(
            text(
                """
                SELECT constraint_name
                FROM user_constraints
                WHERE table_name = :table_name
                  AND constraint_type = 'C'
                """
            ),
            {"table_name": table_name},
        ).fetchall()
    }
    for old_name in old_constraint_names:
        if old_name.upper() in existing:
            db.session.execute(text(f"ALTER TABLE {table_name.lower()} DROP CONSTRAINT {old_name}"))
            db.session.commit()
    db.session.execute(
        text(f"ALTER TABLE {table_name.lower()} ADD CONSTRAINT {constraint_name} CHECK ({condition})")
    )
    db.session.commit()
