# JobTracker — Career Intelligence & Job Application Management

JobTracker is a full-stack, production-grade career management and job search tracking platform built with **Next.js 16 (App Router)** and **Django REST Framework**.

---

## 🌟 Key Features

* **Modern SaaS Web App (Next.js 16 + React 19 + TypeScript)**:
  * Sleek Emerald & Slate modern CSS design system with instant dark/light mode.
  * Hero dashboard with countdown to next interview and instant **"Join Video Meeting"** shortcuts.
  * Active Application Pipeline vs. Saved Jobs (Wishlist) with 1-click conversion.
* **Full Job Search Workflow (Phase 3)**:
  * Multi-round interview tracking (Screening, Technical, System Design, Behavioral, Final Round).
  * Recruiter & talent partner contact directory with instant LinkedIn/email shortcuts.
  * Activity logging across Email, Phone, LinkedIn, and WhatsApp channels.
  * 28-day scrollable calendar timeline with action reminders.
* **Document & Resume Hub (Phase 4)**:
  * Multi-resume manager (master resumes vs. role-tailored resumes).
  * Drag-and-drop file upload dropzone (PDF, DOCX).
  * In-browser PDF preview modal.
  * Set primary active resume.
* **Robust Backend (Django 5.2 + DRF)**:
  * JWT Bearer authentication with automatic rotation and refresh retry.
  * Multi-tenant data isolation per user.
  * Interactive Swagger / OpenAPI 3.0 documentation at `/api/v1/docs/`.
  * Comprehensive test suite with 27 automated tests.

---

## 📁 Repository Layout

* `frontend/` — Next.js 16 web application
* `backend/` — Django REST Framework API (`apps.accounts`, `apps.applications`, `apps.documents`)
* `docs/` — Architecture, workflow, and phase documentation
* `infra/` — Docker and deployment manifests

---

## 🚀 1-Click Quickstart

### Windows (Batch / PowerShell):
Double-click `start_project.bat` or run:
```powershell
.\start_project.ps1
```

### Manual Setup:

1. **Backend:**
   ```powershell
   cd backend
   .venv\Scripts\python.exe manage.py migrate
   .venv\Scripts\python.exe manage.py seed_demo
   .venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
   ```

2. **Frontend:**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. **Open in Browser:**
   * **Web App:** [http://localhost:3000](http://localhost:3000)
   * **API Docs:** [http://127.0.0.1:8000/api/v1/docs/](http://127.0.0.1:8000/api/v1/docs/)
   * **Demo Account:** `demo@jobtracker.local` / `Password123!` (or click the "Autofill Demo Account" button on the login screen)
