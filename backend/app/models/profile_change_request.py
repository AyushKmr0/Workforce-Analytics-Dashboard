from datetime import datetime

from extensions import db


class ProfileChangeRequest(db.Model):
    __tablename__ = "profile_change_requests"

    id = db.Column(db.Integer, db.Identity(start=1), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_changes = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="PENDING_HR", index=True)
    hr_reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    admin_reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[user_id], lazy="joined")
    hr_reviewer = db.relationship("User", foreign_keys=[hr_reviewed_by], lazy="joined")
    admin_reviewer = db.relationship("User", foreign_keys=[admin_reviewed_by], lazy="joined")

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('PENDING_HR','PENDING_ADMIN','APPROVED','REJECTED')",
            name="api_ck_profile_change_status",
        ),
    )
