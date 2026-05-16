# Employee Management System

Role-based employee management platform with dashboards for Admin, HR, and Employee users. The app includes attendance tracking, employee records, leave management, documents, profile updates, approvals, analytics, and work reports.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Chart.js
- Backend: Flask, Flask-JWT-Extended, Flask-SQLAlchemy
- Database: Oracle via `oracledb`
- File storage: Local uploads or Cloudinary

## Project Structure

```text
employee_management_system/
  backend/      Flask API, models, services, routes, database config
  frontend/     React app, pages, layouts, services, UI components
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The backend runs on:

```text
http://127.0.0.1:5001
```

Create `backend/.env` with values like:

```env
SECRET_KEY=change-this
ORACLE_USER=your_oracle_user
ORACLE_PASSWORD=your_oracle_password
ORACLE_DSN=localhost:1521/xe
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=admin123
ADMIN_SEED_NAME=System Admin
CLOUDINARY_URL=
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://127.0.0.1:5173
```

Vite proxies `/api` requests to the Flask backend at `http://127.0.0.1:5001`.

## Build

```bash
cd frontend
npm run build
```

## Main Features

- Role-based login for Admin, HR, and Employee users
- Automatic check-in after successful login
- Attendance check-out and attendance history
- Admin and HR employee management
- Leave requests and leave review workflows
- Profile update requests and approval flow
- Employee documents and profile details
- Analytics dashboards and team reports
- Employee work report submission

## Notes

- Do not commit `backend/.env`, `frontend/node_modules`, `frontend/dist`, or Python cache folders.
- The backend creates database tables and seeds the admin account on startup when configured.
