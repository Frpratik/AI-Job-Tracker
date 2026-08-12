# Phase 9 & 10: Production DevOps, Docker & CI/CD Deployment

## Overview
This runbook covers containerization, orchestration, continuous integration, and production cloud deployment for the **JobTracker Platform**.

---

## 1. Local Production Stack via Docker Compose

### Prerequisites
* Docker Engine 24+
* Docker Compose v2+

### Running the Entire Multi-Container Stack
```bash
# Copy and configure environment variables
cp .env.example .env

# Build and start all 4 services (PostgreSQL, Redis, Django API, Next.js Frontend)
docker compose up --build -d

# Check service health and logs
docker compose ps
docker compose logs -f
```

### Services Map:
* **Frontend**: `http://localhost:3000`
* **Django API**: `http://localhost:8000`
* **Swagger API Docs**: `http://localhost:8000/api/v1/docs/`
* **PostgreSQL 16**: Port `5432`
* **Redis 7**: Port `6379`

---

## 2. Multi-Stage Dockerfile Architecture

### Frontend (`frontend/Dockerfile`)
* Multi-stage build (`deps` ➔ `builder` ➔ `runner`).
* Uses Node.js 20 Alpine.
* Uses Next.js `standalone` mode output. Image size reduced from >1GB to **<120MB**.
* Runs as non-root user `nextjs` (UID 1001).

### Backend (`backend/Dockerfile`)
* Multi-stage build with Python 3.12-slim base.
* Production WSGI/ASGI Gunicorn server with 4 workers and 2 threads.
* Automated startup script `entrypoint.sh` executes database migrations and collects static files automatically before starting the server.
* Runs as non-root user `appuser` (UID 1001).

---

## 3. GitHub Actions CI/CD Pipeline

| Workflow | File | Triggers | Description |
|---|---|---|---|
| **CI Suite** | `.github/workflows/ci.yml` | Push & PR to `main` | Runs PostgreSQL test service, Django test suite (41 tests), and Next.js build validation |
| **Deploy & Publish** | `.github/workflows/deploy.yml` | Git Tags (`v*.*.*`) or manual trigger | Builds multi-platform Docker images and publishes to GitHub Container Registry (`ghcr.io`) |

---

## 4. Cloud Deployment Options

### A. Managed Containers (Render / Railway / Fly.io)
1. Link your GitHub repository.
2. Deploy PostgreSQL managed database and Redis instance.
3. Add web services using the respective `Dockerfile` paths (`backend/Dockerfile` and `frontend/Dockerfile`).
4. Set environment variables (`DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `NEXT_PUBLIC_API_URL`).

### B. AWS ECS / DigitalOcean Kubernetes
1. Push images to container registry using `.github/workflows/deploy.yml`.
2. Configure task definitions for backend and frontend with ALB/Ingress SSL termination.
3. Connect Amazon RDS PostgreSQL and ElastiCache Redis.
