from io import BytesIO
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.applications.models import Application, Company, Job
from apps.documents.models import Document

User = get_user_model()


class DocumentAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="candidate@example.com",
            password="Password123!",
            full_name="Candidate One",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="Password123!",
            full_name="Candidate Two",
        )
        self.client.force_authenticate(user=self.user)

        self.company = Company.objects.create(name="Stripe", user=self.user)
        self.job = Job.objects.create(
            user=self.user,
            company=self.company,
            title="Senior Frontend Engineer",
            location="Remote",
            work_mode="remote",
        )
        self.application = Application.objects.create(
            user=self.user,
            job=self.job,
            status=Application.Status.APPLIED,
        )

    def test_upload_resume_success(self):
        pdf_content = b"%PDF-1.4 sample resume content"
        sample_file = SimpleUploadedFile(
            "resume_2026.pdf",
            pdf_content,
            content_type="application/pdf",
        )

        response = self.client.post(
            "/api/v1/documents/",
            {
                "title": "Senior Frontend Resume",
                "doc_type": "resume",
                "file": sample_file,
                "is_primary": True,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        doc_data = response.data["data"]
        self.assertEqual(doc_data["title"], "Senior Frontend Resume")
        self.assertEqual(doc_data["doc_type"], "resume")
        self.assertTrue(doc_data["is_primary"])
        self.assertEqual(doc_data["mime_type"], "application/pdf")
        self.assertTrue(doc_data["file_size_bytes"] > 0)

    def test_primary_resume_toggle(self):
        file1 = SimpleUploadedFile("r1.pdf", b"%PDF-1.4 r1", content_type="application/pdf")
        file2 = SimpleUploadedFile("r2.pdf", b"%PDF-1.4 r2", content_type="application/pdf")

        doc1 = Document.objects.create(
            user=self.user,
            title="Resume 1",
            doc_type=Document.DocumentType.RESUME,
            file=file1,
            is_primary=True,
        )
        doc2 = Document.objects.create(
            user=self.user,
            title="Resume 2",
            doc_type=Document.DocumentType.RESUME,
            file=file2,
            is_primary=False,
        )

        # Set doc2 as primary via API
        response = self.client.post(f"/api/v1/documents/{doc2.id}/set_primary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        doc1.refresh_from_db()
        doc2.refresh_from_db()
        self.assertFalse(doc1.is_primary)
        self.assertTrue(doc2.is_primary)

    def test_link_document_to_application(self):
        sample_file = SimpleUploadedFile("cover.pdf", b"%PDF-1.4 cover", content_type="application/pdf")
        doc = Document.objects.create(
            user=self.user,
            application=self.application,
            title="Stripe Cover Letter",
            doc_type=Document.DocumentType.COVER_LETTER,
            file=sample_file,
        )

        response = self.client.get(f"/api/v1/applications/{self.application.id}/documents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Stripe Cover Letter")

    def test_user_isolation(self):
        sample_file = SimpleUploadedFile("other.pdf", b"%PDF-1.4 other", content_type="application/pdf")
        other_doc = Document.objects.create(
            user=self.other_user,
            title="Private Resume",
            doc_type=Document.DocumentType.RESUME,
            file=sample_file,
        )

        # User 1 cannot retrieve User 2's document
        response = self.client.get(f"/api/v1/documents/{other_doc.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_file_extension_rejected(self):
        bad_file = SimpleUploadedFile("virus.exe", b"executable content", content_type="application/octet-stream")
        response = self.client.post(
            "/api/v1/documents/",
            {
                "title": "Bad File",
                "doc_type": "other",
                "file": bad_file,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
