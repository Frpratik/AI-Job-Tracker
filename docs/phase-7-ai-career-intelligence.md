# Phase 7: AI Career Intelligence

## Overview
Phase 7 introduces the **AI Career Copilot Suite**, giving candidates AI-powered capabilities across resume keyword optimization, tailored cover letter drafting, and mock interview preparation.

---

## 1. AI Services & Engine (`backend/apps/ai_assistant/services/ai_engine.py`)

### Core AI Capabilities:
1. **ATS Resume Matcher & Keyword Gap Analysis (`scan_ats_match`)**:
   * Scans candidate resume text against job requirements.
   * Calculates overall ATS compatibility score (0-100%).
   * Breaks down matching technical keywords, missing target keywords, hard skills %, and soft skills %.
   * Returns actionable optimization recommendations.
2. **Personalized Cover Letter Generator (`generate_cover_letter`)**:
   * Generates tailored cover letters with tone customization (`professional`, `enthusiastic`, `confident`, `creative`).
   * Weaves candidate strengths directly with company values and role requirements.
3. **Interview Coach & Mock Question Generator (`generate_interview_prep`)**:
   * Produces tailored interview questions categorized by round type (`Technical`, `System Architecture`, `Behavioral STAR`, `Culture Fit`).
   * Provides "Why they ask this" interviewer insight, bulleted talking points, and structured STAR framework answer guidelines (Situation, Task, Action, Result).

---

## 2. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ai/ats-scan/` | Analyzes resume text / document ID against job description / application |
| `POST` | `/api/v1/ai/cover-letter/` | Drafts a tailored cover letter with chosen tone |
| `POST` | `/api/v1/ai/interview-prep/` | Generates role-specific questions and STAR answer guides |

---

## 3. Frontend AI Copilot Hub (`frontend/src/app/ai-copilot/page.tsx`)

* **Role Autofill Selector**: Automatically populates job details and requirements from any active tracked application.
* **3 Dedicated AI Workspaces**:
  * **ATS Scanner Tab**: Circular match score badge, matched keyword chips, missing priority keywords, and optimization bullet points.
  * **Cover Letter Studio Tab**: Tone selector, real-time draft editor, 1-click **"Copy to Clipboard"**, and 1-click **"Save to Documents Hub"**.
  * **Interview Coach Tab**: Multi-question practice cards with STAR blueprints.
* **1-Click Application Detail AI Actions**: Direct links in `/applications/[id]` to immediately scan the application or practice interview questions.
