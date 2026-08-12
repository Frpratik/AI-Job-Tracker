from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.billing.models import Subscription

User = get_user_model()


class BillingAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="billing_user@example.com",
            password="Password123!",
            full_name="Billing Candidate",
        )
        self.client.force_authenticate(user=self.user)

    def test_get_default_subscription(self):
        response = self.client.get("/api/v1/billing/subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        data = response.data["data"]

        self.assertEqual(data["plan"], "free")
        self.assertEqual(data["status"], "active")
        self.assertFalse(data["is_pro"])
        self.assertEqual(data["max_applications"], 15)
        self.assertEqual(data["max_ai_scans"], 5)
        self.assertEqual(data["max_resumes"], 1)

    def test_upgrade_to_pro_monthly(self):
        response = self.client.post(
            "/api/v1/billing/upgrade/",
            {"plan": "pro_monthly"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        data = response.data["data"]

        self.assertEqual(data["plan"], "pro_monthly")
        self.assertTrue(data["is_pro"])
        self.assertIsNone(data["max_applications"])
        self.assertIsNone(data["max_ai_scans"])
        self.assertIsNotNone(data["current_period_end"])

    def test_upgrade_to_pro_yearly(self):
        response = self.client.post(
            "/api/v1/billing/upgrade/",
            {"plan": "pro_yearly", "yearly": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["plan"], "pro_yearly")
        self.assertTrue(data["is_pro"])

    def test_cancel_subscription(self):
        # First upgrade to Pro
        sub, _ = Subscription.objects.get_or_create(user=self.user)
        sub.upgrade_to_pro(yearly=False)
        self.assertTrue(sub.is_pro)

        # Cancel via API
        response = self.client.post("/api/v1/billing/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["plan"], "free")
        self.assertFalse(data["is_pro"])

    def test_unauthenticated_blocked(self):
        self.client.logout()
        response = self.client.get("/api/v1/billing/subscription/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
