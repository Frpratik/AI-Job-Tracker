# Architecture

## System Overview

JobTracker uses a decoupled monorepo architecture:
* **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript with custom Modern CSS Design System.
* **Backend**: Django 5.2 + Django REST Framework (`/api/v1`) with modular apps (`accounts`, `applications`, `documents`).
* **Database**: PostgreSQL (Production/Docker) / SQLite (Fast Local Test/Dev).

```text
Next.js 16 (App Router + React 19 + TypeScript)
        |
        | REST / JSON / JWT (Bearer auth + refresh rotation)
        v
Django REST Framework (/api/v1)
        ├── apps.accounts     (Auth, JWT tokens, Onboarding profiles)
        ├── apps.applications (Pipeline, Jobs, Recruiters, Interviews, Activity, Reminders)
        └── apps.documents    (Resumes, Cover Letters, PDF Storage & Preview)
        |
        v
PostgreSQL / SQLite
```

## Frontend Architecture (`frontend/`)

* **App Router (`src/app/`)**: High-performance streaming routes for Dashboard, Pipeline, Applications, Documents, Calendar, Recruiters, and Settings.
* **Modern Design System (`src/app/globals.css`)**: Emerald & slate color tokens, responsive sidebar, glassmorphic surfaces, instant dark/light mode switching, and micro-animations.
* **API Client (`src/lib/api.ts`)**: Resilient HTTP client with automatic `Authorization: Bearer <token>` injection and seamless token refresh retry on `401 Unauthorized`.
* **State & Auth (`src/context/AuthContext.tsx`)**: Global user session with automatic token hydration and demo mode support.

## Backend Architecture (`backend/`)

* **Apps Layout**:
  * `apps.accounts`: Custom `User` model, email verification, password reset, and career `Profile`.
  * `apps.applications`: `Application`, `Company`, `Job`, `StatusHistory`, `Note`, `Tag`, `Recruiter`, `Interview`, `Communication`, `Reminder`, `Notification`.
  * `apps.documents`: `Document` (Resumes, cover letters, portfolios, attachments, storage, and primary resume toggling).
* **Standard Response Envelope**:
  ```json
  {"success": true, "data": {}}
  ```
* **Security & Isolation**:
  * Every model is explicitly scoped to `user_id`.
  * File uploads are stored in isolated per-user directories under `media/users/<user_id>/documents/`.

## Environments

* **Local Dev**: Run `start_project.bat` or `start_project.ps1` to launch Django (`http://127.0.0.1:8000`) and Next.js (`http://localhost:3000`).
* **Interactive Docs**: Swagger UI at `http://127.0.0.1:8000/api/v1/docs/`.
* **Test Suite**: Automated tests run with `$env:DB_ENGINE='sqlite'; .venv\Scripts\python.exe manage.py test`.
