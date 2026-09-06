# Smart Attendance Management System

An enterprise-grade attendance tracking system with role-based dashboards for **Admin**, **HOD**, **Faculty**, and **Student**. It features time-gated attendance marking, leave management, substitution requests, attendance corrections, notifications, and report generation.

## Architecture

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Frontend   | React 19 + Vite 6 + TypeScript + Tailwind CSS 4        |
| Backend    | FastAPI + SQLAlchemy (async) + Pydantic 2              |
| Database   | PostgreSQL (via asyncpg)                               |
| Auth       | JWT (dev-mode demo login) / Firebase ID tokens (prod)  |

```
MARKUP/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── core/            # config, database, formatters, utils
│   │   ├── dependencies/    # auth guards (require_role)
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── routers/         # auth, admin, faculty, student, hod, reports, notifications
│   │   ├── schemas/         # Pydantic request/response models
│   │   └── services/        # auth, audit, notifications, email
│   ├── sql/                 # schema migrations
│   ├── seed_data.py         # demo data seed script
│   ├── requirements.txt
│   └── Dockerfile
└── FRONTEND/                # React SPA
    └── src/
        ├── components/      # per-role UI (admin/, faculty/, student/, hod/, common/)
        ├── context/         # AppContext (auth + per-role data loading)
        ├── lib/             # apiClient (fetch wrapper + snake_case/camelCase)
        ├── mock/            # legacy mock data (replaced by live API)
        └── types/           # TypeScript domain types
```

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** (npm, or bun)

## Getting Started

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate                 # Windows  |  source venv/bin/activate (Linux/macOS)
pip install -r requirements.txt
```

Configure the database and services:

```bash
copy .env.example .env               # Windows  |  cp .env.example .env (Linux/macOS)
```

Set `SUPABASE_DB_URL` (or a local Postgres URL) in `.env`. For local dev you can point
it at a local Postgres instance. Set `DEV_MODE=true` to enable password-less demo login.

Seed the database with demo data:

```bash
python seed_data.py
```

Run the API server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

> Port 8001 is used by default so a clean dev setup on this machine never collides
> with the `D:\AI AT Evaluation` project, which already occupies port 8000.

- API root: http://localhost:8001/api
- Interactive docs (Swagger): http://localhost:8001/api/docs
- Health check: http://localhost:8001/api/health

### 2. Frontend

```bash
cd FRONTEND
npm install
npm run dev                          # starts Vite on http://localhost:3000
```

Set the backend origin in `VITE_API_BASE_URL` if it differs from the default
(`http://localhost:8001/api`).

## Demo Accounts

With `DEV_MODE=true` and a seeded database, log in with these credentials
(or by typing just the role keyword: `admin`, `hod`, `faculty`, `student`):

| Role    | Email                        |
| ------- | ---------------------------- |
| Admin   | admin@university.edu         |
| HOD     | hod.cs@university.edu        |
| Faculty | sarah.jenkins@university.edu |
| Student | alex.mercer@student.edu      |

## Feature Overview

- **Admin**: manage departments, subjects, faculty & students (single/bulk import), timetable slots, academic calendar, audit logs, DB backups.
- **HOD**: department analytics, faculty monitoring, approve leaves, corrections, and substitutions.
- **Faculty**: mark/update attendance within time gates, view my classes & timetable, respond to leave requests, request & review substitutions, submit attendance corrections.
- **Student**: attendance summary & history, personal timetable, leave applications, notifications, profile.
- **Cross-cutting**: JWT auth, role-based access control, notification feeds (`/api/notifications/`), email (Resend) & SMS (MSG91) reminders, PDF/Excel report exports.

## API Overview

All routes are prefixed with `/api`:

| Router      | Prefix            | Responsibility                     |
| ----------- | ----------------- | ---------------------------------- |
| auth        | `/api/auth`       | login dev/firebase, me, refresh    |
| admin       | `/api/admin`      | master data + governance           |
| faculty     | `/api/faculty`    | attendance, leave queue, corrections, substitutions |
| student     | `/api/student`    | dashboard, attendance, timetable, leaves, profile |
| hod         | `/api/hod`        | dashboard, analysis, monitoring    |
| reports     | `/api/reports`    | aggregate statistics, exports      |
| notifications| `/api/notifications` | notification feed & preferences |

Interactive docs at `/api/docs` list every endpoint with request/response schemas.

## Environment Variables

All configuration lives in `backend/.env` (see `.env.example`):

- `SUPABASE_DB_URL` — async PostgreSQL connection string.
- `SECRET_KEY` / `ALGORITHM` / `ACCESS_TOKEN_EXPIRE_MINUTES` — JWT settings.
- `DEV_MODE` — when `true`, use demo-role login; when `false`, require Firebase tokens.
- `FIREBASE_CREDENTIALS_JSON`, `RESEND_API_KEY`, `SMS_API_KEY` — external services.
- `FRONTEND_URL` — allowed CORS origin(s).

Frontend env vars are in `FRONTEND/.env` (see `.env.example`):

- `VITE_API_BASE_URL` — backend API origin (default `http://localhost:8001/api`).

## Scripts

| Command                 | Location  | Purpose                              |
| ----------------------- | --------- | ------------------------------------ |
| `python seed_data.py`   | backend/  | Reset & seed demo data               |
| `python test_endpoints.py` | backend/ | Smoke-test key API endpoints       |
| `uvicorn app.main:app`  | backend/  | Run the API server                   |
| `npm run dev`           | FRONTEND/ | Start the Vite dev server            |
| `npm run lint`          | FRONTEND/ | Type-check with `tsc --noEmit`       |
| `npm run build`         | FRONTEND/ | Production build                     |

## Docker

Build and run the API with Docker:

```bash
docker build -f backend/Dockerfile -t smart-attendance-api .
docker run -p 8001:8000 smart-attendance-api
```

## Project Status

**In progress.** The backend API is fully implemented and the frontend has been
wired to it end-to-end via `FRONTEND/src/lib/apiClient.ts` + `AppContext` (live
data replaces the legacy `mock/` fixtures). Backend verification is ongoing.