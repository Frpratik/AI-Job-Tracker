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

    def test_tag_api_returns_owned_tags_in_success_envelope(self):
        created = self.client.post(
            reverse("tag-list"), {"name": "Follow up", "color": "#1F6A4A"}, format="json"
        )
        listed = self.client.get(reverse("tag-list"))

        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertTrue(created.data["success"])
        self.assertEqual(listed.data["data"]["count"], 1)
        self.assertEqual(listed.data["data"]["results"][0]["name"], "Follow up")

    def test_owner_can_delete_application(self):
        created = self.create_application()
        application_id = created.data["data"]["id"]

        response = self.client.delete(reverse("application-detail", args=(application_id,)))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Application.objects.filter(pk=application_id).exists())

    def test_recruiter_management_and_scoping(self):
        company = Company.objects.create(user=self.user, name="Meta")
        response = self.client.post(
            reverse("recruiter-list"),
            {
                "name": "Alex Recruiter",
                "email": "alex@meta.example",
                "company_id": company.id,
                "phone": "+1 555-0100",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        recruiter_id = response.data["data"]["id"]

        # Other user cannot access this recruiter
        self.client.force_authenticate(self.other)
        blocked = self.client.get(reverse("recruiter-detail", args=(recruiter_id,)))
        self.assertEqual(blocked.status_code, status.HTTP_404_NOT_FOUND)

    def test_interview_scheduling_and_calendar_events(self):
        created = self.create_application()
        app_id = created.data["data"]["id"]

        response = self.client.post(
            reverse("application-interviews", args=(app_id,)),
            {
                "title": "System Design Round",
                "round_number": 1,
                "interview_type": "system_design",
                "scheduled_at": "2026-09-01T15:00:00Z",
                "duration_minutes": 60,
                "meeting_url": "https://meet.example.com/sys-design",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["title"], "System Design Round")

        # Calendar endpoint returns this event
        calendar_res = self.client.get(reverse("calendar-events"))
        self.assertEqual(calendar_res.status_code, status.HTTP_200_OK)
        events = calendar_res.data["data"]
        self.assertTrue(any(e["title"] == "System Design Round" for e in events))

    def test_communication_logging(self):
        created = self.create_application()
        app_id = created.data["data"]["id"]

        response = self.client.post(
            reverse("application-communications", args=(app_id,)),
            {
                "channel": "email",
                "direction": "inbound",
                "summary": "Invitation to schedule first round",
                "contact_date": "2026-08-15T10:00:00Z",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["summary"], "Invitation to schedule first round")

    def test_reminder_toggle_complete(self):
        created = self.create_application()
        app_id = created.data["data"]["id"]

        rem_res = self.client.post(
            reverse("reminder-list"),
            {
                "application_id": app_id,
                "title": "Follow up with HR",
                "reminder_type": "follow_up",
                "due_at": "2026-08-20T09:00:00Z",
            },
            format="json",
        )
        self.assertEqual(rem_res.status_code, status.HTTP_201_CREATED)
        rem_id = rem_res.data["data"]["id"]

        toggle_res = self.client.post(reverse("reminder-toggle-complete", args=(rem_id,)))
        self.assertEqual(toggle_res.status_code, status.HTTP_200_OK)
        self.assertTrue(toggle_res.data["data"]["is_completed"])

    def test_convert_wishlist_to_applied(self):
        saved = self.create_application(company="Apple", title="iOS Engineer")
        app_id = saved.data["data"]["id"]

        # Put in wishlist
        self.client.patch(
            reverse("application-change-status", args=(app_id,)),
            {"status": "wishlist"},
            format="json",
        )

        convert_res = self.client.post(
            reverse("application-convert-wishlist", args=(app_id,)),
            {"source": "Direct Apply", "applied_date": "2026-08-15"},
            format="json",
        )
        self.assertEqual(convert_res.status_code, status.HTTP_200_OK)
        self.assertEqual(convert_res.data["data"]["status"], "applied")
        self.assertEqual(convert_res.data["data"]["source"], "Direct Apply")

