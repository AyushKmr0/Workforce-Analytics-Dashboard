def iso(value):
    return value.isoformat() if value else None


def money(value):
    return float(value or 0)


def department_payload(department):
    if not department:
        return None
    return {"id": department.id, "name": department.name}


def user_payload(user):
    return {
        "id": user.id,
        "employee_code": user.employee_code,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "salary": money(user.salary),
        "department": department_payload(user.department),
        "department_id": user.department_id,
        "phone_number": user.phone_number,
        "address": user.address,
        "date_of_birth": iso(user.date_of_birth),
        "joining_date": iso(user.joining_date),
        "profile_image": user.profile_image,
        "status": user.status,
        "last_login": iso(user.last_login),
    }
