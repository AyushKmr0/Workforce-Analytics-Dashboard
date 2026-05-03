from datetime import timedelta

from app.models import Attendance, User
from app.schemas.attendance_schema import attendance_payload
from app.schemas.user_schema import user_payload
from app.services.attendance_service import today_local


ALLOWED_RANGES = {1, 2, 7, 14, 30}


def requested_days(raw_days):
    try:
        days = int(raw_days or 7)
    except (TypeError, ValueError):
        return 7
    return days if days in ALLOWED_RANGES else 7


def attendance_report(base_user_query, days):
    end_date = today_local()
    start_date = end_date - timedelta(days=days - 1)
    user_ids = [row[0] for row in base_user_query.with_entities(User.id).all()]
    if not user_ids:
        return empty_report(days, start_date, end_date)

    items = (
        Attendance.query.filter(
            Attendance.user_id.in_(user_ids),
            Attendance.date >= start_date,
            Attendance.date <= end_date,
        )
        .order_by(Attendance.date.desc(), Attendance.id.desc())
        .limit(500)
        .all()
    )
    status_counts = {"PRESENT": 0, "HALF_DAY": 0, "ABSENT": 0, "ON_LEAVE": 0}
    total_hours = 0.0
    attendance_score = 0.0
    expected_user_days = {(user_id, end_date - timedelta(days=offset)) for user_id in user_ids for offset in range(days)}
    recorded_user_days = set()
    for item in items:
        recorded_user_days.add((item.user_id, item.date))
        status_counts[item.status] = status_counts.get(item.status, 0) + 1
        total_hours += float(item.total_hours or 0)
        if item.status == "PRESENT":
            attendance_score += 1
        elif item.status == "HALF_DAY":
            attendance_score += 0.5
        elif item.status == "ON_LEAVE":
            attendance_score += 1

    expected_records = len(user_ids) * days
    status_counts["ABSENT"] = max(status_counts.get("ABSENT", 0), len(expected_user_days - recorded_user_days))
    average_attendance = round((attendance_score / expected_records) * 100, 2) if expected_records else 0
    average_hours = round(total_hours / len(items), 2) if items else 0
    return {
        "items": [attendance_payload(item) | {"employee": user_payload(item.user)} for item in items],
        "summary": {
            "days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "people": len(user_ids),
            "records": len(items),
            "expected_records": expected_records,
            "average_attendance": average_attendance,
            "average_hours": average_hours,
            "status_counts": status_counts,
        },
    }


def empty_report(days, start_date, end_date):
    return {
        "items": [],
        "summary": {
            "days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "people": 0,
            "records": 0,
            "expected_records": 0,
            "average_attendance": 0,
            "average_hours": 0,
            "status_counts": {"PRESENT": 0, "HALF_DAY": 0, "ABSENT": 0, "ON_LEAVE": 0},
        },
    }
