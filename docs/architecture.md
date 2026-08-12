# Architecture

## System Overview

JobTracker uses a decoupled, high-performance monorepo architecture:
* **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript with a custom Modern CSS Design System.
* **Backend**: Django 5.2 + Django REST Framework (`/api/v1`) with modular apps (`accounts`, `applications`, `documents`, `ai_assistant`, `billing`).
* **Caching & Broker**: Redis 7 Alpine.
* **Database**: PostgreSQL 16 (Production / Docker Compose) / SQLite (Fast Local Dev/Test).

```text
Next.js 16 (App Router + React 19 + TypeScript)
        │
        │  REST / JSON / JWT (Bearer auth + refresh rotation)
        ▼
Django REST Framework (/api/v1)
        ├── apps.accounts     (Auth, JWT tokens, Onboarding profiles)
        ├── apps.applications (Pipeline, Jobs, Recruiters, Interviews, Activity, Reminders, Analytics)
        ├── apps.documents    (Resumes, Cover Letters, PDF Storage & Preview)
        ├── apps.ai_assistant (ATS Matcher, Cover Letter Studio, STAR Interview Coach)
        └── apps.billing      (Subscriptions, Quotas, Plans & Entitlements)
        │
   ┌────┴────────────┐
   ▼                 ▼
PostgreSQL 16     Redis 7
```

---

## 1. Frontend Architecture (`frontend/`)

* **App Router (`src/app/`)**: 17 production routes including Dashboard, Pipeline, Applications, Documents, Analytics, AI Copilot, Billing, Calendar, Recruiters, Profile, Login, Register, and Onboarding.
* **Modern Design System (`src/app/globals.css`)**: Emerald brand tokens, responsive desktop sidebar + mobile bottom navigation bar, glassmorphism, dark/light theme switcher, touch-optimized targets.
* **API Client (`src/lib/api.ts`)**: Resilient HTTP client with automatic `Authorization: Bearer <token>` injection and token refresh rotation on `401 Unauthorized`.
* **State & Auth (`src/context/AuthContext.tsx`)**: Global user session with automatic token hydration and 1-click demo login support.

---

## 2. Backend Architecture (`backend/`)

* **Apps Layout**:
  * `apps.accounts`: Custom `User` model, email verification, password reset, and career `Profile`.
  * `apps.applications`: Core job applications, multi-round interviews, recruiter directory, activity logs, reminders, and `analytics_service.py`.
  * `apps.documents`: `Document` model with file upload validation, MIME extraction, primary resume toggling, and application attachments.
  * `apps.ai_assistant`: Heuristic semantic keyword engine, ATS scoring algorithm, tone-calibrated cover letter generator, and STAR interview question coach.
  * `apps.billing`: `Subscription` model, Free vs. Pro plan entitlements, quota consumption counters, and upgrade/cancellation actions.
* **Standard Response Envelope**:
  ```json
  {"success": true, "data": {}}
  ```
* **Security & Multi-Tenant Isolation**:
  * Every database query is strictly scoped to `request.user`.
  * File uploads stored in per-user isolated paths (`media/users/<user_id>/documents/`).

---

## 3. DevOps & CI/CD

* **Multi-Stage Dockerfiles**:
  * `frontend/Dockerfile`: Node.js 20 Alpine standalone runner (<120MB image) running as non-root `nextjs` user.
  * `backend/Dockerfile`: Python 3.12-slim base with Gunicorn WSGI/ASGI concurrency and non-root `appuser`.
* **Docker Compose (`docker-compose.yml`)**: Single-command orchestrator for PostgreSQL 16, Redis 7, Django API, and Next.js Frontend.
* **GitHub Actions (`.github/workflows/`)**:
  * `ci.yml`: Automated PostgreSQL test suite execution (41/41 tests passing) and Next.js production build verification.
  * `deploy.yml`: Automated container build and registry publication.
