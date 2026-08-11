# Phase 2 — Core Application Tracker

## Delivered

- User-owned Company, Job, Application, StatusHistory, Note, Tag, and
  ApplicationTag models with ownership-aware relationships and database indexes.
- Paginated application CRUD, status transitions, archive, notes, tags,
  dashboard summaries, search, status/priority/work-mode filters, and sorting.
- Flutter dashboard, application search/list, add/edit/detail/delete flows,
  status timeline, notes, empty/loading/error states, and live refresh behavior.
- Idempotent local demo seed and a web development preview alongside Android/iOS.

## Demo preview

```powershell
cd backend
$env:DB_ENGINE='sqlite'
$env:CORS_ALLOWED_ORIGINS='http://127.0.0.1:5173'
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py seed_demo
.venv\Scripts\python manage.py runserver 127.0.0.1:8000

cd ../mobile
flutter run -d web-server --web-hostname 127.0.0.1 --web-port 5173 `
  --dart-define=API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Local demo credentials are printed by `seed_demo`. The command is for local
development only and is never run by deployment configuration.

## Deferred by phase boundary

- Saved jobs conversion, recruiters, communications, interviews, reminders,
  notifications, and calendar: Phase 3.
- Secure documents and resumes: Phase 4.
- Full conversion and trend analytics: Phase 5.
