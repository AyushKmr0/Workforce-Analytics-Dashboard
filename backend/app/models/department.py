from extensions import db


class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, db.Identity(start=1), primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)

    users = db.relationship("User", back_populates="department", lazy="select")
