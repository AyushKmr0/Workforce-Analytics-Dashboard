from datetime import date, datetime

from extensions import db


class WorkReport(db.Model):
    __tablename__ = "work_reports"

    id = db.Column(db.Integer, db.Identity(start=1), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    completed_work = db.Column(db.String(2000), nullable=False)
    pending_work = db.Column(db.String(2000))
    completion_percent = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="work_reports", lazy="joined")

    __table_args__ = (
        db.UniqueConstraint("user_id", "report_date", name="api_uq_work_reports_user_date"),
        db.CheckConstraint(
            "completion_percent >= 0 AND completion_percent <= 100",
            name="api_ck_work_reports_completion",
        ),
    )
