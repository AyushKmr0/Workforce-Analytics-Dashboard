from app.schemas.user_schema import iso


def attendance_payload(record):
    if not record:
        return None
    return {
        "id": record.id,
        "user_id": record.user_id,
        "date": iso(record.date),
        "check_in": iso(record.check_in),
        "check_out": iso(record.check_out),
        "total_hours": float(record.total_hours or 0),
        "status": record.status,
    }
