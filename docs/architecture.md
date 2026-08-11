# Architecture

## Boundaries

JobTracker uses a monorepo with independently deployable mobile and API
applications. Flutter owns presentation and device concerns. Django owns
validation, authorization, workflows, and durable state. PostgreSQL is the
system of record.

```text
Flutter (Riverpod + repositories)
        |
        | REST / JSON / JWT
        v
Django REST Framework (/api/v1)
        |
        v
PostgreSQL
```

## Mobile

The Flutter client is feature-based. Each feature may contain `presentation`,
`application`, and `data` folders. Shared routing, networking, secure storage,
and design tokens live under `lib/src/core`.

Riverpod is the state-management boundary. It keeps asynchronous state explicit,
is simple to replace in tests, and avoids coupling domain operations to widget
contexts. Dio provides bounded network timeouts and a single refresh-token retry.
Tokens use platform secure storage and are never persisted in preferences or
logs.

## API

The backend currently has `accounts` and `applications` bounded contexts. The
applications context owns companies, jobs, tracked applications, status
history, notes, and tags. New Django apps are introduced only when a feature
owns distinct models and workflows; the project does not pre-create empty apps.

API responses follow one of these shapes:

```json
{"success": true, "data": {}}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process the request.",
    "fields": {}
  }
}
```

JWT access tokens are short-lived. Refresh tokens rotate and are blacklisted
after use. All private endpoints default to authenticated access.

## Data ownership

Private feature tables must have an unambiguous owner relationship. Querysets
must be scoped to `request.user` before object lookup. Client-provided user IDs
must never determine ownership.

## Environments

- Development: Docker PostgreSQL plus local Django and Flutter processes.
- Test: isolated SQLite for fast unit/API tests; PostgreSQL integration tests
  will be added with application models.
- Staging/production: managed PostgreSQL, HTTPS, private object storage, and
  environment-managed secrets.
