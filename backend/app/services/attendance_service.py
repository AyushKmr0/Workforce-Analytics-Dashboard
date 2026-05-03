from datetime import datetime, timezone, timedelta
from decimal import Decimal

from extensions import db
from app.models import Attendance

IST = timezone(timedelta(hours=5, minutes=30))


def now_local():
    return datetime.now(IST).replace(tzinfo=None)


def today_local():
    return now_local().date()


def get_today_attendance(user_id):
    return Attendance.query.filter_by(user_id=user_id, date=today_local()).first()


def check_in(user_id):
    record = get_today_attendance(user_id)
    if record and record.check_in and not record.check_out:
        return record, False
    record = record or Attendance(user_id=user_id, date=today_local())
    record.check_in = now_local()
    record.check_out = None
    record.total_hours = Decimal("0")
    record.status = "PRESENT"
    db.session.add(record)
    return record, True


def check_out(user_id):
    record = get_today_attendance(user_id)
    if not record or not record.check_in or record.check_out:
        return record, False
    record.check_out = now_local()
    hours = (record.check_out - record.check_in).total_seconds() / 3600
    record.total_hours = Decimal(str(round(hours, 2)))
    if hours < 4:
        record.status = "HALF_DAY"
    return record, True
