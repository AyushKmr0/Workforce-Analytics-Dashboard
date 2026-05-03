from datetime import timedelta

from app.models import User, WorkReport
from app.schemas.work_report_schema import work_report_payload
from app.services.attendance_service import today_local


ALLOWED_RANGES = {1, 2, 7, 14, 30}


def requested_days(raw_days):
    try:
        days = int(raw_days or 7)
    except (TypeError, ValueError):
        return 7
    return days if days in ALLOWED_RANGES else 7


def team_work_report(base_user_query, days):
    end_date = today_local()
    start_date = end_date - timedelta(days=days - 1)
    user_ids = [row[0] for row in base_user_query.with_entities(User.id).all()]
    if not user_ids:
        return {"items": [], "summary": empty_summary(days, start_date, end_date)}

    items = (
        WorkReport.query.filter(
            WorkReport.user_id.in_(user_ids),
            WorkReport.report_date >= start_date,
            WorkReport.report_date <= end_date,
        )
        .order_by(WorkReport.report_date.desc(), WorkReport.id.desc())
        .limit(500)
        .all()
    )
    average_completion = (
        round(sum(item.completion_percent for item in items) / len(items), 2) if items else 0
    )
    return {
        "items": [work_report_payload(item) for item in items],
        "summary": empty_summary(days, start_date, end_date)
        | {
            "people": len(user_ids),
            "records": len(items),
            "expected_records": len(user_ids) * days,
            "average_completion": average_completion,
            "pending_records": sum(1 for item in items if item.pending_work),
        },
    }


def empty_summary(days, start_date, end_date):
    return {
        "days": days,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "people": 0,
        "records": 0,
        "expected_records": 0,
        "average_completion": 0,
        "pending_records": 0,
    }
