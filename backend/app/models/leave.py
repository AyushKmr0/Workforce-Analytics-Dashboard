from extensions import db


class Leave(db.Model):
    __tablename__ = "leaves"

    id = db.Column(db.Integer, db.Identity(start=1), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    leave_type = db.Column(db.String(40), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.String(1000))
    status = db.Column(db.String(20), nullable=False, default="PENDING", index=True)
    approved_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))

    user = db.relationship("User", foreign_keys=[user_id], back_populates="leave_requests")
    approver = db.relationship("User", foreign_keys=[approved_by], lazy="joined")

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('PENDING','APPROVED','REJECTED')", name="api_ck_leaves_status"
        ),
    )
