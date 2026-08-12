# Phase 4: Document Management & Resumes

## Overview
Phase 4 provides a centralized document hub for managing master resumes, tailored resumes for specific job postings, cover letters, portfolios, and diplomas.

---

## 1. Domain Models (`backend/apps/documents/models.py`)

### Document (`Document`)
* `id`: UUID primary key
* `user`: ForeignKey(User, on_delete=CASCADE, related_name='documents')
* `application`: ForeignKey(Application, on_delete=SET_NULL, null=True, blank=True, related_name='documents')
* `title`: CharField(max_length=255)
* `doc_type`: Choices (`resume`, `cover_letter`, `portfolio`, `certificate`, `other`)
* `file`: FileField(upload_to=user_document_directory_path)
* `file_size_bytes`: PositiveIntegerField(default=0)
* `mime_type`: CharField(max_length=100, default='application/pdf')
* `is_primary`: BooleanField(default=False) — designates the primary active resume; automatically resets other resumes on save.
* `version_number`: PositiveIntegerField(default=1)
* `parsed_text`: TextField(blank=True) — extracts plaintext for future Phase 7 AI search & matching.
* `created_at`, `updated_at`

---

## 2. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/v1/documents/` | List and upload documents (multipart/form-data) |
| `GET` / `PATCH` / `DELETE` | `/api/v1/documents/<id>/` | Retrieve, edit metadata, or delete document |
| `POST` | `/api/v1/documents/<id>/set_primary/` | Designate as master primary active resume |
| `GET` | `/api/v1/documents/<id>/download/` | Direct binary attachment download |
| `GET` / `POST` | `/api/v1/applications/<id>/documents/` | Retrieve or attach documents to specific application |

---

## 3. Storage & Security Architecture

* **Isolated Upload Paths**: Documents are stored under `media/users/<user_id>/documents/<uuid>_<filename>` to prevent collision and ensure tenant isolation.
* **Validation**:
  * Allowed extensions: `.pdf`, `.docx`, `.doc`, `.txt`, `.rtf`, `.png`, `.jpg`
  * Max size: 15MB
* **In-Browser PDF Viewer**: Next.js uses an embedded preview modal allowing candidates to view PDF resumes directly without downloading.
