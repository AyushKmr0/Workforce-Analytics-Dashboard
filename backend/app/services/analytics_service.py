from datetime import date, timedelta
from decimal import Decimal

from app.models import Attendance, Leave, User
from app.services.attendance_service import today_local


ALLOWED_ANALYTICS_DAYS = {1, 7, 30}


def requested_analytics_days(raw_days):
    try:
        days = int(raw_days or 1)
    except (TypeError, ValueError):
        return 1
    return days if days in ALLOWED_ANALYTICS_DAYS else 1


def calculate_age(date_of_birth):
    if not date_of_birth:
        return None
    today = date.today()
    return today.year - date_of_birth.year - (
        (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    )


def employee_query(department_id=None):
    query = User.query.filter(User.role != "ADMIN")
    if department_id:
        query = query.filter(User.department_id == department_id)
    return query


def get_age_group_counts(department_id=None):
    groups = {"18-25": 0, "26-35": 0, "36-50": 0, "51-60": 0, "60+": 0}
    for user in employee_query(department_id).all():
        age = calculate_age(user.date_of_birth)
        if age is None:
            continue
        elif 18 <= age <= 25:
            groups["18-25"] += 1
        elif 26 <= age <= 35:
            groups["26-35"] += 1
        elif 36 <= age <= 50:
            groups["36-50"] += 1
        elif 51 <= age <= 60:
            groups["51-60"] += 1
        else:
            groups["60+"] += 1
    return groups


def get_department_stats():
    stats = {}
    for user in employee_query().all():
        department = user.department.name if user.department else "Unassigned"
        stats[department] = stats.get(department, 0) + 1
    return stats


def get_salary_distribution(department_id=None):
    buckets = {"0-25k": 0, "25k-50k": 0, "50k-100k": 0, "100k-150k": 0, "150k+": 0}
    for user in employee_query(department_id).all():
        salary = Decimal(user.salary or 0)
        if salary < 25000:
            buckets["0-25k"] += 1
        elif salary < 50000:
            buckets["25k-50k"] += 1
        elif salary < 100000:
            buckets["50k-100k"] += 1
        elif salary < 150000:
            buckets["100k-150k"] += 1
        else:
            buckets["150k+"] += 1
    return buckets


def get_attendance_stats(department_id=None, days=1):
    today = today_local()
    start_date = today - timedelta(days=days - 1)
    users_query = employee_query(department_id).filter(User.status == "ACTIVE")
    user_ids = [row[0] for row in users_query.with_entities(User.id).all()]
    attendance_query = Attendance.query.join(User).filter(
        Attendance.date >= start_date,
        Attendance.date <= today,
    )
    leave_query = Leave.query.join(User, Leave.user_id == User.id).filter(
        Leave.status == "APPROVED",
        Leave.start_date <= today,
        Leave.end_date >= start_date,
    )
    if department_id:
        attendance_query = attendance_query.filter(User.department_id == department_id)
        leave_query = leave_query.filter(User.department_id == department_id)
    stats = {"PRESENT": 0, "ABSENT": 0, "HALF_DAY": 0, "ON_LEAVE": 0}
    marked_user_ids = set()
    for item in attendance_query.all():
        key = (item.user_id, item.date)
        stats[item.status] = stats.get(item.status, 0) + 1
        marked_user_ids.add(key)
    for item in leave_query.all():
        start = max(item.start_date, start_date)
        end = min(item.end_date, today)
        for offset in range((end - start).days + 1):
            key = (item.user_id, start + timedelta(days=offset))
            if key not in marked_user_ids:
                stats["ON_LEAVE"] += 1
                marked_user_ids.add(key)
    expected_user_days = {(user_id, start_date + timedelta(days=offset)) for user_id in user_ids for offset in range(days)}
    stats["ABSENT"] = max(len(expected_user_days - marked_user_ids), 0)
    return stats


def get_leave_stats(department_id=None):
    query = Leave.query.join(User, Leave.user_id == User.id)
    if department_id:
        query = query.filter(User.department_id == department_id)
    stats = {"PENDING": 0, "APPROVED": 0, "REJECTED": 0}
    for item in query.all():
        stats[item.status] = stats.get(item.status, 0) + 1
    return stats


def get_analytics_payload(department_id=None, days=1):
    return {
        "days": days,
        "age_groups": get_age_group_counts(department_id),
        "departments": get_department_stats(),
        "salary_distribution": get_salary_distribution(department_id),
        "attendance": get_attendance_stats(department_id, days),
        "leave_stats": get_leave_stats(department_id),
    }


def get_user_analysis_payload(user_id, days=1):
    today = today_local()
    start_date = today - timedelta(days=days - 1)
    records = Attendance.query.filter(
        Attendance.user_id == user_id,
        Attendance.date >= start_date,
        Attendance.date <= today,
    ).all()
    leaves = Leave.query.filter(
        Leave.user_id == user_id,
        Leave.status == "APPROVED",
        Leave.start_date <= today,
        Leave.end_date >= start_date,
    ).all()
    stats = {"Working Days": 0, "Working Hours": 0, "Leaves": 0, "Half Leaves": 0, "Absent": 0}
    marked_dates = set()
    for record in records:
        marked_dates.add(record.date)
        stats["Working Hours"] += float(record.total_hours or 0)
        if record.status == "HALF_DAY":
            stats["Half Leaves"] += 1
        elif record.status == "PRESENT":
            stats["Working Days"] += 1
        elif record.status == "ON_LEAVE":
            stats["Leaves"] += 1
    for leave in leaves:
        start = max(leave.start_date, start_date)
        end = min(leave.end_date, today)
        for offset in range((end - start).days + 1):
            leave_date = start + timedelta(days=offset)
            if leave_date not in marked_dates:
                stats["Leaves"] += 1
                marked_dates.add(leave_date)
    expected_dates = {start_date + timedelta(days=offset) for offset in range(days)}
    stats["Absent"] = max(len(expected_dates - marked_dates), 0)
    stats["Working Hours"] = round(stats["Working Hours"], 2)
    return {
        "days": days,
        "start_date": start_date.isoformat(),
        "end_date": today.isoformat(),
        "stats": stats,
    }
