from django.test import TestCase

from apps.accounts.models import User


class UserModelTests(TestCase):
    def test_email_is_normalized_and_password_is_hashed(self):
        user = User.objects.create_user(
            email="Person@EXAMPLE.com", full_name="Person", password="SecurePass!8472"
        )
        self.assertEqual(user.email, "person@example.com")
        self.assertTrue(user.check_password("SecurePass!8472"))
