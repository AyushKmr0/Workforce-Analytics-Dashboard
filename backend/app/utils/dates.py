from datetime import datetime


def parse_date(value, required=False):
    if not value:
        if required:
            raise ValueError("Date is required.")
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()
