from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.applications.models import Application, Company, Interview, Job

User = get_user_model()


class AnalyticsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="analytics_user@example.com",
            password="Password123!",
            full_name="Analytics Candidate",
        )
        self.client.force_authenticate(user=self.user)

        self.company1 = Company.objects.create(name="Acme Corp", user=self.user)
        self.job1 = Job.objects.create(
            user=self.user,
            company=self.company1,
            title="Senior Engineer",
            work_mode="remote",
            salary_min=130000,
            salary_max=160000,
        )
        self.app1 = Application.objects.create(
            user=self.user,
            job=self.job1,
            status=Application.Status.TECHNICAL_INTERVIEW,
            applied_date=date.today() - timedelta(days=10),
            source="LinkedIn",
            priority="high",
        )
        Interview.objects.create(
            user=self.user,
            application=self.app1,
            title="Technical Coding Round",
            round_number=1,
            scheduled_at=timezone.now() - timedelta(days=5),
        )

        self.company2 = Company.objects.create(name="Beta Labs", user=self.user)
        self.job2 = Job.objects.create(
            user=self.user,
            company=self.company2,
            title="Full-Stack Developer",
            work_mode="hybrid",
            salary_min=110000,
            salary_max=140000,
        )
        self.app2 = Application.objects.create(
            user=self.user,
            job=self.job2,
            status=Application.Status.OFFER,
            applied_date=date.today() - timedelta(days=20),
            source="Referral",
            priority="high",
        )

    def test_get_analytics_summary_and_funnel(self):
        response = self.client.get("/api/v1/analytics/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        data = response.data["data"]

        summary = data["summary"]
        self.assertEqual(summary["total_tracked"], 2)
        self.assertEqual(summary["applied_count"], 2)
        self.assertEqual(summary["interview_count"], 2)
        self.assertEqual(summary["offer_count"], 1)

        rates = data["rates"]
        self.assertEqual(rates["interview_rate_pct"], 100.0)
        self.assertEqual(rates["offer_rate_pct"], 50.0)

        funnel = data["funnel"]
        self.assertEqual(len(funnel), 5)
        self.assertEqual(funnel[0]["stage"], "Applied")
        self.assertEqual(funnel[0]["count"], 2)

    def test_source_roi_breakdown(self):
        response = self.client.get("/api/v1/analytics/")
        data = response.data["data"]
        source_roi = data["source_roi"]
        self.assertTrue(len(source_roi) >= 2)
        sources = [s["source"] for s in source_roi]
        self.assertIn("LinkedIn", sources)
        self.assertIn("Referral", sources)

    def test_export_csv_endpoint(self):
        response = self.client.get("/api/v1/analytics/export/csv/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn('attachment; filename="job_tracker_applications.csv"', response["Content-Disposition"])
        content = response.content.decode("utf-8")
        self.assertIn("Acme Corp", content)
        self.assertIn("Beta Labs", content)
        self.assertIn("Senior Engineer", content)

    def test_export_json_endpoint(self):
        response = self.client.get("/api/v1/analytics/export/json/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('attachment; filename="job_tracker_backup.json"', response["Content-Disposition"])
        json_data = response.json()
        self.assertEqual(json_data["user"]["email"], "analytics_user@example.com")
        self.assertEqual(json_data["total_applications"], 2)
        self.assertEqual(len(json_data["applications"]), 2)
