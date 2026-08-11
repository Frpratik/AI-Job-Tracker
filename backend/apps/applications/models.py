import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Company(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="companies"
    )
    name = models.CharField(max_length=160)
    website = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)

    class Meta:
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(Lower("name"), "user", name="unique_company_name_per_user")
        ]
        indexes = [models.Index(fields=("user", "name"))]

    def __str__(self):
        return self.name


class Job(TimeStampedModel):
    class WorkMode(models.TextChoices):
        REMOTE = "remote", "Remote"
        HYBRID = "hybrid", "Hybrid"
        ONSITE = "onsite", "On-site"
        UNSPECIFIED = "unspecified", "Not specified"

    class EmploymentType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        CONTRACT = "contract", "Contract"
        INTERNSHIP = "internship", "Internship"
        OTHER = "other", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="jobs"
    )
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="jobs")
    title = models.CharField(max_length=180)
    external_id = models.CharField(max_length=120, blank=True)
    url = models.URLField(blank=True)
    location = models.CharField(max_length=160, blank=True)
    work_mode = models.CharField(
        max_length=16, choices=WorkMode.choices, default=WorkMode.UNSPECIFIED
    )
    employment_type = models.CharField(
        max_length=16, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME
    )
    experience_level = models.CharField(max_length=80, blank=True)
    salary_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=3, default="USD")

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("user", "title")),
            models.Index(fields=("user", "location")),
        ]

    def clean(self):
        if self.company_id and self.user_id != self.company.user_id:
            raise ValidationError("The job and company must have the same owner.")
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValidationError(
                {"salary_max": "Maximum salary must be greater than minimum salary."}
            )

    def __str__(self):
        return f"{self.title} at {self.company.name}"


class Application(TimeStampedModel):
    class Status(models.TextChoices):
        WISHLIST = "wishlist", "Wishlist"
        APPLIED = "applied", "Applied"
        VIEWED = "viewed", "Application viewed"
        RECRUITER_CONTACTED = "recruiter_contacted", "Recruiter contacted"
        SCREENING = "screening", "Screening"
        ASSESSMENT = "assessment", "Assessment"
        TECHNICAL_INTERVIEW = "technical_interview", "Technical interview"
        HR_INTERVIEW = "hr_interview", "HR interview"
        FINAL_INTERVIEW = "final_interview", "Final interview"
        OFFER = "offer", "Offer"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"
        ON_HOLD = "on_hold", "On hold"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications"
    )
    job = models.OneToOneField(Job, on_delete=models.PROTECT, related_name="application")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.APPLIED)
    applied_date = models.DateField(null=True, blank=True)
    source = models.CharField(max_length=80, blank=True)
    priority = models.CharField(max_length=8, choices=Priority.choices, default=Priority.MEDIUM)
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=("user", "status", "is_archived")),
            models.Index(fields=("user", "applied_date")),
            models.Index(fields=("user", "updated_at")),
        ]

    def clean(self):
        if self.job_id and self.user_id != self.job.user_id:
            raise ValidationError("The application and job must have the same owner.")

    def __str__(self):
        return str(self.job)


class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="status_history"
    )
    from_status = models.CharField(max_length=24, choices=Application.Status.choices, blank=True)
    to_status = models.CharField(max_length=24, choices=Application.Status.choices)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-changed_at",)
        indexes = [models.Index(fields=("application", "changed_at"))]


class Note(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="application_notes"
    )
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="notes")
    body = models.TextField(max_length=10000)
    is_important = models.BooleanField(default=False)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("user", "application", "created_at"))]


class Tag(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="application_tags"
    )
    name = models.CharField(max_length=40)
    color = models.CharField(max_length=7, default="#1F6A4A")

    class Meta:
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(Lower("name"), "user", name="unique_tag_name_per_user")
        ]

    def __str__(self):
        return self.name


class ApplicationTag(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="tag_links")
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name="application_links")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("application", "tag"), name="unique_tag_per_application"
            )
        ]

    def clean(self):
        if self.application_id and self.tag_id and self.application.user_id != self.tag.user_id:
            raise ValidationError("The application and tag must have the same owner.")
