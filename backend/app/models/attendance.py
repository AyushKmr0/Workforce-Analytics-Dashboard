from extensions import db


class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, db.Identity(start=1), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    check_in = db.Column(db.DateTime)
    check_out = db.Column(db.DateTime)
    total_hours = db.Column(db.Numeric(5, 2))
    status = db.Column(db.String(20), nullable=False, default="PRESENT", index=True)

    user = db.relationship("User", back_populates="attendance_records", lazy="joined")

    __table_args__ = (
        db.UniqueConstraint("user_id", "date", name="api_uq_attendance_user_date"),
        db.CheckConstraint(
            "status IN ('PRESENT','ABSENT','HALF_DAY','ON_LEAVE')",
            name="api_ck_attendance_status",
        ),
    )
