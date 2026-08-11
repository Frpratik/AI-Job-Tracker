import os
import secrets
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from apps.accounts.models import Profile, User
from apps.applications.models import Application, Company, Job, Note
from apps.applications.services import record_initial_status, transition_status


class Command(BaseCommand):
    help = "Create an idempotent local demo account and sample applications."

    def handle(self, *args, **options):
        user, _ = User.objects.get_or_create(
            email="demo@jobtracker.local",
            defaults={"full_name": "Demo Candidate", "is_email_verified": True},
        )
        user.full_name = "Demo Candidate"
        user.is_email_verified = True
        password = os.getenv("DEMO_PASSWORD") or f"Demo-{secrets.token_urlsafe(10)}"
        user.set_password(password)
        user.save()
        Profile.objects.update_or_create(
            user=user,
            defaults={
                "target_role": "Backend Developer",
                "preferred_locations": ["Bengaluru", "Remote"],
                "experience_level": "mid",
                "work_preference": "hybrid",
                "onboarding_completed": True,
            },
        )

        samples = (
            ("Northstar Labs", "Senior Python Engineer", "screening", "Remote", "high", "Referral"),
            (
                "Canopy",
                "Platform Developer",
                "technical_interview",
                "Bengaluru",
                "high",
                "LinkedIn",
            ),
            (
                "Orbit Systems",
                "Django API Engineer",
                "applied",
                "Pune",
                "medium",
                "Company website",
            ),
        )
        for index, (company_name, title, target_status, location, priority, source) in enumerate(
            samples
        ):
            company, _ = Company.objects.get_or_create(user=user, name=company_name)
            job, _ = Job.objects.get_or_create(
                user=user,
                company=company,
                title=title,
                defaults={
                    "location": location,
                    "work_mode": "remote" if location == "Remote" else "hybrid",
                    "url": f"https://example.com/jobs/{index + 1}",
                },
            )
            application, created = Application.objects.get_or_create(
                user=user,
                job=job,
                defaults={
                    "status": "applied",
                    "applied_date": date.today() - timedelta(days=index * 3 + 1),
                    "priority": priority,
                    "source": source,
                },
            )
            if created:
                record_initial_status(application)
                if target_status != "applied":
                    transition_status(application, target_status)
                Note.objects.create(
                    user=user,
                    application=application,
                    body="Review the role and prepare the next follow-up.",
                )

        self.stdout.write(self.style.SUCCESS(f"Demo ready: demo@jobtracker.local / {password}"))
