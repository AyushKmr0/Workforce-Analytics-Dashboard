from app.schemas.user_schema import iso


def document_payload(document):
    return {
        "id": document.id,
        "user_id": document.user_id,
        "file_url": document.file_url,
        "file_type": document.file_type,
        "uploaded_at": iso(document.uploaded_at),
    }
