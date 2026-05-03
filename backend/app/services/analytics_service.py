from datetime import date
from decimal import Decimal

from app.models import Attendance, Leave, User


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
    groups = {"18-25": 0, "26-35": 0, "36-50": 0, "50+": 0, "Unknown": 0}
    for user in employee_query(department_id).all():
        age = calculate_age(user.date_of_birth)
        if age is None:
            groups["Unknown"] += 1
        elif 18 <= age <= 25:
            groups["18-25"] += 1
        elif 26 <= age <= 35:
            groups["26-35"] += 1
        elif 36 <= age <= 50:
            groups["36-50"] += 1
        elif age > 50:
            groups["50+"] += 1
        else:
            groups["Unknown"] += 1
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


def get_attendance_stats(department_id=None):
    query = Attendance.query.join(User)
    if department_id:
        query = query.filter(User.department_id == department_id)
    stats = {"PRESENT": 0, "ABSENT": 0, "HALF_DAY": 0, "ON_LEAVE": 0}
    for item in query.all():
        stats[item.status] = stats.get(item.status, 0) + 1
    return stats


def get_leave_stats(department_id=None):
    query = Leave.query.join(User, Leave.user_id == User.id)
    if department_id:
        query = query.filter(User.department_id == department_id)
    stats = {"PENDING": 0, "APPROVED": 0, "REJECTED": 0}
    for item in query.all():
        stats[item.status] = stats.get(item.status, 0) + 1
    return stats


def get_analytics_payload(department_id=None):
    return {
        "age_groups": get_age_group_counts(department_id),
        "departments": get_department_stats(),
        "salary_distribution": get_salary_distribution(department_id),
        "attendance": get_attendance_stats(department_id),
        "leave_stats": get_leave_stats(department_id),
    }
