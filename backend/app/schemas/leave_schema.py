from app.schemas.user_schema import iso, user_payload


def leave_payload(leave):
    return {
        "id": leave.id,
        "user_id": leave.user_id,
        "employee": user_payload(leave.user) if leave.user else None,
        "leave_type": leave.leave_type,
        "start_date": iso(leave.start_date),
        "end_date": iso(leave.end_date),
        "reason": leave.reason,
        "status": leave.status,
        "approved_by": leave.approved_by,
    }
