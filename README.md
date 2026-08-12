# JobTracker — AI Career Intelligence & Job Search Platform

[![CI Pipeline](https://github.com/Frpratik/AI-Job-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Frpratik/AI-Job-Tracker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

JobTracker is a production-grade, full-stack **Career Intelligence & Job Application Management Platform** built with **Next.js 16 (App Router)** and **Django REST Framework**.

---

## 🌟 Platform Capabilities & Feature Suites

### 1. Modern SaaS Web Architecture (Next.js 16 + React 19 + TypeScript)
* **Responsive UI Design System**: Tailored Emerald & Slate theme with automatic dark/light mode switching and mobile bottom navigation bar.
* **Live Dashboard**: Interactive pipeline metrics, interview countdown with 1-click **"Join Video Meeting"** shortcuts, and celebratory confetti animations on offers.
* **Application Management**: Segmented Active Pipeline vs. Saved Jobs (Wishlist) with 1-click conversion and search/filter toolbars.

### 2. Full Job Search Lifecycle
* **Multi-Round Interview Tracker**: Manage screenings, take-homes, technical loops, and final rounds with calendar sync.
* **Talent Partner & Recruiter Directory**: Direct LinkedIn, email, and phone contact logging with automatic follow-up reminders.
* **Omnichannel Activity Log**: Record correspondence across Email, Calls, LinkedIn, WhatsApp, and Video meetings.
* **28-Day Interactive Calendar**: Swipeable visual agenda strip with scheduled rounds and upcoming deadlines.

### 3. Document & Resume Management
* **Multi-Resume Versioning**: Manage master resumes alongside tailored role-specific resumes.
* **Drag-and-Drop Dropzone**: File validation for PDF and DOCX uploads with auto-computed MIME and file sizes.
* **In-Browser PDF Viewer**: Embedded preview modal for immediate resume inspection.

### 4. Advanced Analytics & Career Insights
* **Hiring Conversion Funnel**: `Applied` ➔ `Screening` ➔ `Interview` ➔ `Offer` ➔ `Accepted` with drop-off percentages.
* **Velocity Metrics**: Average response velocity in days from submission to first recruiter round.
* **Discovery Source ROI Matrix**: Channel comparison (Referral vs. LinkedIn vs. Job Boards) by interview conversion rate.
* **Data Portability**: 1-click streaming exports for **RFC 4180 CSV spreadsheets** and **JSON data backups**.

### 5. AI Career Copilot
* **AI ATS Resume Scanner & Matcher**: 0-100% compatibility score against target job descriptions, matched keyword highlights, missing requirement warnings, and optimization recommendations.
* **AI Cover Letter Studio**: Dynamic drafting tailored to company values with tone customization (Professional, Enthusiastic, Confident, Creative) and direct save to Documents Hub.
* **AI Interview Coach**: Role-specific technical, system architecture, and behavioral STAR questions with structured answer guidelines (Situation, Task, Action, Result).

### 6. Monetization & Subscription Entitlements
* **Free Starter Tier ($0/mo)**: 15 active applications, 5 AI scans/mo, 5 AI cover letters/mo, 1 master resume.
* **Pro Career Intelligence ($12/mo or $99/yr)**: Unlimited applications, unlimited AI ATS scans, unlimited cover letters, unlimited resumes, advanced funnel analytics, and data exports.

### 7. Production DevOps & CI/CD
* **Multi-Stage Dockerfiles**: Next.js standalone runner (<120MB) and Django Gunicorn ASGI backend with non-root security.
* **Docker Compose Orchestrator**: PostgreSQL 16, Redis 7, Django API, and Next.js Web App.
* **GitHub Actions Workflows**: Automated PostgreSQL test suite execution (41/41 tests passing) and production build validation.

---

## 🚀 Quickstart

### Option A: 1-Click Windows Script
```powershell
.\start_project.ps1
```

### Option B: Docker Compose (Full Stack)
```bash
cp .env.example .env
docker compose up --build -d
```
* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **API & Swagger Docs:** [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/)
* **Demo Account:** `demo@jobtracker.local` / `Password123!`

### Option C: Manual Development Setup
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

---

## 🧪 Verification & Testing
```powershell
# Run backend test suite (41 tests)
cd backend
$env:DB_ENGINE='sqlite'; .venv\Scripts\python.exe manage.py test

# Verify Next.js build
cd frontend
npm run build
```
