from uuid import uuid4

import cloudinary
import cloudinary.uploader
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx"}


def save_upload(file_storage, subfolder):
    if not file_storage or not file_storage.filename:
        return None
    filename = secure_filename(file_storage.filename)
    extension = filename.rsplit(".", 1)[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type.")

    if not cloudinary.config().cloud_name:
        raise ValueError("Cloudinary is not configured. Add CLOUDINARY_URL in .env.")

    result = cloudinary.uploader.upload(
        file_storage,
        folder=f"employee_management/{subfolder}",
        public_id=uuid4().hex,
        resource_type="auto",
        use_filename=False,
        unique_filename=False,
    )
    return {"file_url": result["secure_url"], "file_type": extension}
