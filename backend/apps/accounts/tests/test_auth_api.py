from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Profile, User


class AuthenticationApiTests(APITestCase):
    def test_registration_creates_user_profile_and_tokens(self):
        response = self.client.post(
            reverse("register"),
            {
                "full_name": "Ada Lovelace",
                "email": "ADA@example.com",
                "password": "SecurePass!8472",
                "confirm_password": "SecurePass!8472",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("access", response.data["data"]["tokens"])
        user = User.objects.get(email="ada@example.com")
        self.assertTrue(Profile.objects.filter(user=user).exists())
        self.assertNotEqual(user.password, "SecurePass!8472")

    def test_login_rejects_invalid_credentials_with_structured_error(self):
        response = self.client.post(
            reverse("login"),
            {"email": "missing@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("error", response.data)

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotates_tokens_inside_success_envelope(self):
        user = User.objects.create_user(
            email="refresh@example.com", full_name="Refresh", password="SecurePass!8472"
        )
        refresh = RefreshToken.for_user(user)

        response = self.client.post(
            reverse("token-refresh"), {"refresh": str(refresh)}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])

    def test_authenticated_user_can_update_only_own_profile(self):
        user = User.objects.create_user(
            email="owner@example.com", full_name="Owner", password="SecurePass!8472"
        )
        Profile.objects.create(user=user)
        other = User.objects.create_user(
            email="other@example.com", full_name="Other", password="SecurePass!8472"
        )
        Profile.objects.create(user=other, target_role="Unchanged")
        self.client.force_authenticate(user)

        response = self.client.patch(
            reverse("me"),
            {"full_name": "Updated", "profile": {"target_role": "Backend Developer"}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        other.profile.refresh_from_db()
        self.assertEqual(user.profile.target_role, "Backend Developer")
        self.assertEqual(other.profile.target_role, "Unchanged")

    def test_authenticated_user_can_complete_onboarding_preferences(self):
        user = User.objects.create_user(
            email="onboarding@example.com",
            full_name="Candidate",
            password="SecurePass!8472",
        )
        Profile.objects.create(user=user)
        self.client.force_authenticate(user)

        response = self.client.patch(
            reverse("me"),
            {
                "profile": {
                    "target_role": "Backend Developer",
                    "preferred_locations": ["Bengaluru", "Remote"],
                    "experience_level": "mid",
                    "work_preference": "hybrid",
                    "onboarding_completed": True,
                }
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.profile.refresh_from_db()
        self.assertTrue(user.profile.onboarding_completed)
        self.assertEqual(user.profile.preferred_locations, ["Bengaluru", "Remote"])
