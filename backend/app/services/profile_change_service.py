import json


PROFILE_FIELDS = {
    "name",
    "email",
    "phone_number",
    "address",
    "city",
    "district",
    "state",
    "pincode",
    "date_of_birth",
    "joining_date",
    "profile_image",
}


def clean_profile_changes(data):
    return {key: data.get(key) for key in PROFILE_FIELDS if key in data}


def encoded_changes(changes):
    return json.dumps(changes, default=str)


def apply_profile_changes(user, changes, parse_date):
    for key, value in changes.items():
        if key in {"date_of_birth", "joining_date"}:
            setattr(user, key, parse_date(value) if value else None)
        elif key in PROFILE_FIELDS:
            setattr(user, key, value or None)
