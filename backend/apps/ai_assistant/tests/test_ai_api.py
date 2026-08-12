from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.applications.models import Application, Company, Job
from apps.documents.models import Document

User = get_user_model()


class AIAssistantAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="ai_candidate@example.com",
            password="Password123!",
            full_name="Alex Rivera",
        )
        self.client.force_authenticate(user=self.user)

        self.company = Company.objects.create(name="OpenScale AI", user=self.user)
        self.job = Job.objects.create(
            user=self.user,
            company=self.company,
            title="Senior Backend Engineer",
            work_mode="remote",
        )
        self.application = Application.objects.create(
            user=self.user,
            job=self.job,
            status=Application.Status.APPLIED,
        )

        sample_file = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 sample", content_type="application/pdf")
        self.resume_doc = Document.objects.create(
            user=self.user,
            title="Master Resume 2026",
            doc_type=Document.DocumentType.RESUME,
            file=sample_file,
            is_primary=True,
            parsed_text="Experienced Senior Python and Django Engineer with PostgreSQL, Redis, Docker, and REST API experience.",
        )

    def test_ats_scan_direct_text(self):
        response = self.client.post(
            "/api/v1/ai/ats-scan/",
            {
                "resume_text": "Senior Python developer with strong expertise in Django, PostgreSQL, Docker, and Git.",
                "job_description": "We are seeking a Backend Engineer with Python, Django, Kubernetes, AWS, and PostgreSQL skills.",
                "job_title": "Backend Engineer",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        data = response.data["data"]

        self.assertTrue(30 <= data["score"] <= 100)
        self.assertIn("Python", data["matched_keywords"])
        self.assertIn("Django", data["matched_keywords"])
        self.assertIn("PostgreSQL", data["matched_keywords"])
        self.assertTrue(len(data["strengths"]) > 0)
        self.assertTrue(len(data["improvement_suggestions"]) > 0)

    def test_ats_scan_with_document_and_application(self):
        response = self.client.post(
            "/api/v1/ai/ats-scan/",
            {
                "resume_id": str(self.resume_doc.id),
                "application_id": str(self.application.id),
                "job_description": "Requirements: Python, REST, Celery, Redis.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        data = response.data["data"]
        self.assertIn("Python", data["matched_keywords"])

    def test_cover_letter_generator(self):
        response = self.client.post(
            "/api/v1/ai/cover-letter/",
            {
                "job_title": "Staff Platform Engineer",
                "company_name": "Stripe",
                "tone": "enthusiastic",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        data = response.data["data"]
        self.assertEqual(data["company_name"], "Stripe")
        self.assertEqual(data["job_title"], "Staff Platform Engineer")
        self.assertIn("Dear Hiring Manager at Stripe", data["content"])
        self.assertIn("Alex Rivera", data["content"])

    def test_interview_prep_question_generator(self):
        response = self.client.post(
            "/api/v1/ai/interview-prep/",
            {
                "job_title": "Principal Architect",
                "company_name": "Datadog",
                "interview_type": "technical",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        data = response.data["data"]
        self.assertEqual(data["company_name"], "Datadog")
        self.assertTrue(len(data["questions"]) >= 4)
        q1 = data["questions"][0]
        self.assertIn("question", q1)
        self.assertIn("star_framework", q1)
        self.assertIn("talking_points", q1)

    def test_unauthenticated_requests_blocked(self):
        self.client.logout()
        response = self.client.post("/api/v1/ai/ats-scan/", {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
