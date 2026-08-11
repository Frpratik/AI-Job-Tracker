from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Profile, User
from apps.applications.models import Application, ApplicationStatusHistory, Company, Job, Note, Tag


def payload(company="OpenAI", title="Backend Engineer"):
    return {
        "job": {
            "company": {"name": company, "website": "https://example.com"},
            "title": title,
            "url": "https://example.com/jobs/1",
            "location": "Remote",
            "work_mode": "remote",
            "employment_type": "full_time",
            "salary_min": "100000.00",
            "salary_max": "140000.00",
            "salary_currency": "USD",
        },
        "status": "applied",
        "applied_date": date.today().isoformat(),
        "source": "Company website",
        "priority": "high",
    }


class ApplicationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="owner@example.com", full_name="Owner", password="SecurePass!8472"
        )
        Profile.objects.create(user=self.user)
        self.other = User.objects.create_user(
            email="other@example.com", full_name="Other", password="SecurePass!8472"
        )
        Profile.objects.create(user=self.other)
        self.client.force_authenticate(self.user)

    def create_application(self, **overrides):
        body = payload(**overrides)
        response = self.client.post(reverse("application-list"), body, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        return response

    def test_create_application_creates_normalized_records_and_history(self):
        response = self.create_application()
        application = Application.objects.get(pk=response.data["data"]["id"])
        self.assertEqual(application.user, self.user)
        self.assertEqual(application.job.company.name, "OpenAI")
        self.assertEqual(application.status_history.count(), 1)
        self.assertEqual(application.status_history.get().to_status, "applied")

    def test_status_transition_is_timestamped_and_noop_is_not_duplicated(self):
        created = self.create_application()
        url = reverse("application-change-status", args=(created.data["data"]["id"],))

        first = self.client.patch(url, {"status": "screening"}, format="json")
        second = self.client.patch(url, {"status": "screening"}, format="json")

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        history = ApplicationStatusHistory.objects.filter(application_id=created.data["data"]["id"])
        self.assertEqual(history.count(), 2)
        self.assertEqual(history.first().from_status, "applied")

    def test_users_cannot_read_or_change_another_users_application(self):
        company = Company.objects.create(user=self.other, name="Private Corp")
        job = Job.objects.create(user=self.other, company=company, title="Secret Role")
        application = Application.objects.create(user=self.other, job=job)

        detail = self.client.get(reverse("application-detail", args=(application.pk,)))
        update = self.client.patch(
            reverse("application-change-status", args=(application.pk,)),
            {"status": "offer"},
            format="json",
        )

        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(update.status_code, status.HTTP_404_NOT_FOUND)

    def test_search_and_status_filter_only_return_matches(self):
        self.create_application(company="OpenAI", title="Backend Engineer")
        second = self.create_application(company="Example", title="Data Analyst")
        self.client.patch(
            reverse("application-change-status", args=(second.data["data"]["id"],)),
            {"status": "screening"},
            format="json",
        )

        search = self.client.get(reverse("application-list"), {"search": "OpenAI"})
        filtered = self.client.get(reverse("application-list"), {"status": "screening"})

        self.assertEqual(search.data["data"]["count"], 1)
        self.assertEqual(filtered.data["data"]["count"], 1)
        self.assertEqual(filtered.data["data"]["results"][0]["job"]["title"], "Data Analyst")

    def test_dashboard_returns_owned_metrics_and_recent_applications(self):
        self.create_application()
        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["total"], 1)
        self.assertEqual(len(response.data["data"]["recent"]), 1)

    def test_invalid_salary_range_returns_structured_validation_error(self):
        body = payload()
        body["job"]["salary_min"] = "150000"
        body["job"]["salary_max"] = "100000"

        response = self.client.post(reverse("application-list"), body, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_notes_are_created_and_scoped_to_the_application_owner(self):
        created = self.create_application()
        application_id = created.data["data"]["id"]
        response = self.client.post(
            reverse("application-notes", args=(application_id,)),
            {"body": "Prepare system design examples.", "is_important": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertTrue(Note.objects.filter(user=self.user, application_id=application_id).exists())

        self.client.force_authenticate(self.other)
        blocked = self.client.get(reverse("application-notes", args=(application_id,)))
        self.assertEqual(blocked.status_code, status.HTTP_404_NOT_FOUND)

    def test_owned_tags_can_be_attached_and_foreign_tags_are_rejected(self):
        created = self.create_application()
        tag = Tag.objects.create(user=self.user, name="Dream role")
        foreign = Tag.objects.create(user=self.other, name="Private")
        detail_url = reverse("application-detail", args=(created.data["data"]["id"],))

        attached = self.client.patch(detail_url, {"tag_ids": [str(tag.id)]}, format="json")
        rejected = self.client.patch(detail_url, {"tag_ids": [str(foreign.id)]}, format="json")

        self.assertEqual(attached.status_code, status.HTTP_200_OK)
        self.assertEqual(attached.data["data"]["tags"][0]["name"], "Dream role")
        self.assertEqual(rejected.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_delete_application(self):
        created = self.create_application()
        application_id = created.data["data"]["id"]

        response = self.client.delete(reverse("application-detail", args=(application_id,)))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Application.objects.filter(pk=application_id).exists())
