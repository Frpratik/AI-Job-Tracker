# Local development

## Backend

Requirements: Python 3.12 and Docker Desktop.

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d postgres
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py runserver
```

API documentation is available at `http://127.0.0.1:8000/api/v1/docs/`.

For tests that do not require a running PostgreSQL instance:

```powershell
$env:DB_ENGINE='sqlite'
.venv\Scripts\python manage.py test
```

## Mobile

Requirements: Flutter stable, Android Studio/Android SDK, and Xcode on macOS for
iOS builds.

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

Use `127.0.0.1` rather than `10.0.2.2` for an iOS simulator. Physical devices
must use the development machine's reachable LAN address.

## Quality checks

```powershell
cd backend
$env:DB_ENGINE='sqlite'
.venv\Scripts\ruff check .
.venv\Scripts\python manage.py check
.venv\Scripts\python manage.py test

cd ../mobile
flutter analyze
flutter test
```

Never commit `.env`, local databases, generated media, tokens, or signing keys.
