from app.schemas.user_schema import iso, user_payload


def work_report_payload(report):
    return {
        "id": report.id,
        "user_id": report.user_id,
        "employee": user_payload(report.user) if report.user else None,
        "report_date": iso(report.report_date),
        "completed_work": report.completed_work,
        "pending_work": report.pending_work,
        "completion_percent": report.completion_percent,
        "created_at": iso(report.created_at),
        "updated_at": iso(report.updated_at),
    }
