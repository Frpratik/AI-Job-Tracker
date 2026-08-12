import os
import secrets
from datetime import date, timedelta
from django.utils import timezone

from django.core.management.base import BaseCommand

from apps.accounts.models import Profile, User
from apps.applications.models import (
    Application,
    Communication,
    Company,
    Interview,
    Job,
    Note,
    Recruiter,
    Reminder,
)
from apps.applications.services import record_initial_status, transition_status


class Command(BaseCommand):
    help = "Create an idempotent local demo account and sample applications with workflow data."

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
                    "salary_min": 120000,
                    "salary_max": 160000,
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

        # Seed Recruiter
        canopy = Company.objects.filter(user=user, name="Canopy").first()
        if canopy:
            recruiter, _ = Recruiter.objects.get_or_create(
                user=user,
                name="Sarah Jenkins",
                defaults={
                    "company": canopy,
                    "email": "sarah.jenkins@canopy.example",
                    "phone": "+1 555-0199",
                    "linkedin_url": "https://linkedin.com/in/sarah-jenkins-demo",
                    "notes": "Talent Partner leading Backend & Platform hiring.",
                    "last_contact_date": date.today() - timedelta(days=2),
                    "next_follow_up_date": date.today() + timedelta(days=3),
                },
            )
            canopy_app = Application.objects.filter(user=user, job__company=canopy).first()
            if canopy_app:
                canopy_app.primary_recruiter = recruiter
                canopy_app.save(update_fields=("primary_recruiter",))

                # Seed Interview
                Interview.objects.get_or_create(
                    user=user,
                    application=canopy_app,
                    title="System Design & Architecture Round",
                    defaults={
                        "round_number": 2,
                        "interview_type": "system_design",
                        "status": "scheduled",
                        "scheduled_at": timezone.now() + timedelta(days=2, hours=3),
                        "duration_minutes": 60,
                        "interviewer_name": "Alex Mercer (Principal Architect)",
                        "meeting_url": "https://meet.google.com/abc-defg-hij",
                        "notes": "Focus on distributed queues, PostgreSQL indexing, and Redis caching.",
                    },
                )

                # Seed Communications
                Communication.objects.get_or_create(
                    user=user,
                    application=canopy_app,
                    summary="Initial LinkedIn outreach from Sarah",
                    defaults={
                        "recruiter": recruiter,
                        "channel": "linkedin",
                        "direction": "inbound",
                        "details": "Sarah reached out regarding the Platform Developer opening.",
                        "contact_date": timezone.now() - timedelta(days=7),
                    },
                )
                Communication.objects.get_or_create(
                    user=user,
                    application=canopy_app,
                    summary="Phone screening call with Sarah",
                    defaults={
                        "recruiter": recruiter,
                        "channel": "phone_call",
                        "direction": "outbound",
                        "details": "Discussed past Django/Python experience, compensation expectations, and tech stack.",
                        "contact_date": timezone.now() - timedelta(days=3),
                    },
                )

                # Seed Reminder
                Reminder.objects.get_or_create(
                    user=user,
                    application=canopy_app,
                    title="Prepare Architecture diagram for Canopy interview",
                    defaults={
                        "reminder_type": "interview",
                        "due_at": timezone.now() + timedelta(days=1, hours=10),
                        "is_completed": False,
                        "notes": "Review microservice patterns and event-driven architecture.",
                    },
                )

        # Seed Saved Job (Wishlist)
        google_co, _ = Company.objects.get_or_create(user=user, name="Google")
        google_job, _ = Job.objects.get_or_create(
            user=user,
            company=google_co,
            title="Senior Staff Systems Engineer",
            defaults={
                "location": "Remote / Bengaluru",
                "work_mode": "remote",
                "url": "https://careers.google.com/jobs/results/123",
                "salary_min": 180000,
                "salary_max": 240000,
            },
        )
        saved_app, saved_created = Application.objects.get_or_create(
            user=user,
            job=google_job,
            defaults={
                "status": "wishlist",
                "priority": "high",
                "source": "Google Careers",
            },
        )
        # Seed Sample Resumes & Documents
        from django.core.files.base import ContentFile
        from apps.documents.models import Document

        sample_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Title (Demo Resume - Senior Full-Stack Engineer)\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
        
        doc_resume, _ = Document.objects.get_or_create(
            user=user,
            title="Senior Full-Stack Engineer (Master Resume 2026)",
            defaults={
                "doc_type": Document.DocumentType.RESUME,
                "is_primary": True,
                "file_size_bytes": 1024 * 450,
                "mime_type": "application/pdf",
                "parsed_text": "Senior Software Engineer with 6+ years building distributed cloud platforms, Python, React, Next.js, and Kubernetes.",
            },
        )
        if not doc_resume.file:
            doc_resume.file.save("demo_master_resume.pdf", ContentFile(sample_pdf_content), save=True)

        doc_canopy_cover, _ = Document.objects.get_or_create(
            user=user,
            title="Canopy Platform Developer - Tailored Cover Letter",
            defaults={
                "doc_type": Document.DocumentType.COVER_LETTER,
                "is_primary": False,
                "application": canopy_app if 'canopy_app' in locals() else None,
                "file_size_bytes": 1024 * 220,
                "mime_type": "application/pdf",
                "parsed_text": "I am excited to apply for the Platform Developer opening at Canopy. My expertise in high-throughput Django APIs aligns directly with your platform scalability goals.",
            },
        )
        if not doc_canopy_cover.file:
            doc_canopy_cover.file.save("canopy_cover_letter.pdf", ContentFile(sample_pdf_content), save=True)

        self.stdout.write(self.style.SUCCESS(f"Demo ready: demo@jobtracker.local / {password}"))

