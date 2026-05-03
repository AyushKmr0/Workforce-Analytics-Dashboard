import json

from app.schemas.user_schema import iso, user_payload


def profile_change_payload(request_item):
    return {
        "id": request_item.id,
        "user_id": request_item.user_id,
        "employee": user_payload(request_item.user) if request_item.user else None,
        "requested_changes": json.loads(request_item.requested_changes or "{}"),
        "status": request_item.status,
        "hr_reviewed_by": request_item.hr_reviewed_by,
        "admin_reviewed_by": request_item.admin_reviewed_by,
        "created_at": iso(request_item.created_at),
        "updated_at": iso(request_item.updated_at),
    }
