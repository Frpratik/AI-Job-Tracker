# Phase 5: Advanced Analytics, Career Insights & Data Export

## Overview
Phase 5 provides candidates with deep visibility into their job search velocity, conversion efficiency across stages, discovery channel performance, and compensation distributions, along with data portability (CSV & JSON exports).

---

## 1. Analytics Service (`backend/apps/applications/analytics_service.py`)

### Core Metrics Calculated:
* **Hiring Funnel**: `Applied` ➔ `Screening` ➔ `Interview` ➔ `Offer` ➔ `Accepted` with drop-off percentages.
* **Conversion Rates**:
  * Interview Rate: `interviews / applied * 100`
  * Offer Rate: `offers / applied * 100`
  * Interview-to-Offer Rate: `offers / interviews * 100`
* **Response Velocity**: Days between `applied_date` and first recruiter interaction (first interview or logged communication).
* **Discovery Source ROI**: Groups applications by discovery channel (`LinkedIn`, `Referral`, `Company Website`, `Indeed`, `Wellfound`, `Other`) and calculates conversion rate per channel.
* **Compensation Insights**: Average min/max salary figures and work mode distribution (`Remote`, `Hybrid`, `On-site`).
* **Weekly Activity Pulse**: 8-week application submission momentum.

---

## 2. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/analytics/` | Full analytics payload with optional `?timeframe=all\|30d\|90d\|1y` filter |
| `GET` | `/api/v1/analytics/export/csv/` | Streams RFC 4180 compliant CSV export file |
| `GET` | `/api/v1/analytics/export/json/` | Complete JSON data backup archive |

---

## 3. Frontend Analytics Hub (`frontend/src/app/analytics/page.tsx`)

* **Executive KPI Cards**: Real-time Interview Rate %, Offer Rate %, Avg Response Velocity, and Avg Pipeline Salary.
* **Visual Conversion Funnel**: Multi-color stage progress bars with counts and percentages.
* **Discovery Source ROI Matrix**: Channel comparison cards highlighting which job sources produce the highest ROI.
* **Weekly Application Velocity**: CSS bar chart showing weekly momentum.
* **1-Click Export Center**: Direct downloads for `.csv` spreadsheet and `.json` archive.
