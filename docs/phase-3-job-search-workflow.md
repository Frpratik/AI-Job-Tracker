# Phase 3: Job Search Workflow & Activity Engine

## Overview
Phase 3 expands JobTracker from a simple application list into a full workflow lifecycle engine. It introduces talent partner management, multi-round interview tracking with video meeting shortcuts, communication logging across channels, actionable due-date reminders, and a unified calendar view.

---

## 1. Domain Models (`backend/apps/applications/models.py`)

### Recruiter & Talent Partner (`Recruiter`)
* `user`: ForeignKey(User, on_delete=CASCADE)
* `company`: ForeignKey(Company, on_delete=SET_NULL, null=True)
* `name`: CharField(max_length=255)
* `email`: EmailField(blank=True)
* `phone`: CharField(max_length=32, blank=True)
* `linkedin_url`: URLField(blank=True)
* `notes`: TextField(blank=True)
* `last_contact_date`: DateField(null=True, blank=True)
* `next_follow_up_date`: DateField(null=True, blank=True)

### Multi-Round Interview (`Interview`)
* `user`: ForeignKey(User, on_delete=CASCADE)
* `application`: ForeignKey(Application, on_delete=CASCADE, related_name='interviews')
* `title`: CharField(max_length=255)
* `round_number`: PositiveIntegerField(default=1)
* `interview_type`: Choices (`screening`, `technical`, `coding`, `system_design`, `behavioral`, `hr`, `take_home`, `final_round`, `other`)
* `status`: Choices (`scheduled`, `completed`, `cancelled`, `rescheduled`)
* `scheduled_at`: DateTimeField()
* `duration_minutes`: PositiveIntegerField(default=45)
* `interviewer_name`, `interviewer_email`: CharField / EmailField
* `meeting_url`: URLField(blank=True)
* `location`, `notes`, `feedback`: TextField(blank=True)

### Communication Logger (`Communication`)
* `user`: ForeignKey(User, on_delete=CASCADE)
* `application`: ForeignKey(Application, on_delete=CASCADE, related_name='communications')
* `recruiter`: ForeignKey(Recruiter, on_delete=SET_NULL, null=True)
* `channel`: Choices (`email`, `phone_call`, `linkedin`, `whatsapp`, `video_call`, `in_person`, `other`)
* `direction`: Choices (`inbound`, `outbound`)
* `summary`: CharField(max_length=255)
* `details`: TextField(blank=True)
* `contact_date`: DateTimeField(default=now)
* `follow_up_date`: DateField(null=True, blank=True)

### Actionable Reminders (`Reminder`)
* `user`: ForeignKey(User, on_delete=CASCADE)
* `application`: ForeignKey(Application, on_delete=CASCADE, null=True, blank=True)
* `interview`: ForeignKey(Interview, on_delete=SET_NULL, null=True, blank=True)
* `title`: CharField(max_length=255)
* `reminder_type`: Choices (`follow_up`, `interview`, `deadline`, `custom`)
* `due_at`: DateTimeField()
* `is_completed`: BooleanField(default=False)
* `completed_at`: DateTimeField(null=True, blank=True)
* `notes`: TextField(blank=True)

---

## 2. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/v1/recruiters/` | List and create recruiter contacts |
| `GET` / `PATCH` / `DELETE` | `/api/v1/recruiters/<id>/` | Manage specific recruiter profile |
| `GET` / `POST` | `/api/v1/interviews/` | List and schedule interview rounds |
| `GET` / `PATCH` / `DELETE` | `/api/v1/interviews/<id>/` | Manage specific interview details |
| `GET` / `POST` | `/api/v1/communications/` | Activity communication history |
| `GET` / `POST` | `/api/v1/reminders/` | Task reminders |
| `POST` | `/api/v1/reminders/<id>/toggle/` | 1-click completion toggle |
| `GET` | `/api/v1/calendar/events/` | Unified chronological agenda (interviews + reminders) |

---

## 3. Frontend Experience (Next.js)

* **Spotlight Card**: Real-time next interview banner with countdown timer and direct video meeting launch button.
* **Reminders Checklist**: Live checkoff bar with immediate backend synchronization.
* **Interactive 28-Day Calendar**: Scrollable date strip with color-coded dot badges and categorized agenda items.
* **Recruiter Directory**: Searchable talent cards with instant `mailto:`, `tel:`, and LinkedIn shortcuts.
