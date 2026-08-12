import uuid
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone


class Subscription(models.Model):
    class Plan(models.TextChoices):
        FREE = "free", "Free Starter"
        PRO_MONTHLY = "pro_monthly", "Pro Career (Monthly)"
        PRO_YEARLY = "pro_yearly", "Pro Career (Yearly)"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAST_DUE = "past_due", "Past Due"
        CANCELED = "canceled", "Canceled"
        TRIALING = "trialing", "Trialing"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.CharField(
        max_length=32,
        choices=Plan.choices,
        default=Plan.FREE,
    )
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    ai_scans_used_this_month = models.PositiveIntegerField(default=0)
    cover_letters_used_this_month = models.PositiveIntegerField(default=0)
    current_period_end = models.DateTimeField(null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} — {self.get_plan_display()} ({self.get_status_display()})"

    @property
    def is_pro(self):
        return self.plan in (self.Plan.PRO_MONTHLY, self.Plan.PRO_YEARLY) and self.status == self.Status.ACTIVE

    @property
    def max_applications(self):
        return None if self.is_pro else 15

    @property
    def max_ai_scans(self):
        return None if self.is_pro else 5

    @property
    def max_cover_letters(self):
        return None if self.is_pro else 5

    @property
    def max_resumes(self):
        return None if self.is_pro else 1

    def can_add_application(self, current_active_count):
        if self.is_pro:
            return True
        return current_active_count < 15

    def can_run_ai_scan(self):
        if self.is_pro:
            return True
        return self.ai_scans_used_this_month < 5

    def can_generate_cover_letter(self):
        if self.is_pro:
            return True
        return self.cover_letters_used_this_month < 5

    def upgrade_to_pro(self, yearly=False):
        self.plan = self.Plan.PRO_YEARLY if yearly else self.Plan.PRO_MONTHLY
        self.status = self.Status.ACTIVE
        duration = timedelta(days=365) if yearly else timedelta(days=30)
        self.current_period_end = timezone.now() + duration
        self.save()

    def cancel_subscription(self):
        if self.is_pro:
            self.plan = self.Plan.FREE
            self.status = self.Status.ACTIVE
            self.current_period_end = None
            self.save()
