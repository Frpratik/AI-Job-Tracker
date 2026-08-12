import os
import uuid
from django.conf import settings
from django.db import models


def user_document_directory_path(instance, filename):
    # Uploads to: uploads/users/<user_id>/documents/<uuid>_<filename>
    user_id = str(instance.user_id) if instance.user_id else "global"
    clean_filename = os.path.basename(filename).replace(" ", "_")
    return f"users/{user_id}/documents/{uuid.uuid4().hex[:8]}_{clean_filename}"


class Document(models.Model):
    class DocumentType(models.TextChoices):
        RESUME = "resume", "Resume / CV"
        COVER_LETTER = "cover_letter", "Cover Letter"
        PORTFOLIO = "portfolio", "Portfolio / Work Sample"
        CERTIFICATE = "certificate", "Certificate / Diploma"
        OTHER = "other", "Other Document"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    application = models.ForeignKey(
        "applications.Application",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    title = models.CharField(max_length=255)
    doc_type = models.CharField(
        max_length=32,
        choices=DocumentType.choices,
        default=DocumentType.RESUME,
    )
    file = models.FileField(upload_to=user_document_directory_path)
    file_size_bytes = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, default="application/pdf")
    is_primary = models.BooleanField(
        default=False,
        help_text="Designates this as the primary active resume for general applications.",
    )
    version_number = models.PositiveIntegerField(default=1)
    parsed_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-is_primary", "-created_at")
        indexes = [
            models.Index(fields=["user", "doc_type"]),
            models.Index(fields=["user", "is_primary"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_doc_type_display()})"

    def save(self, *args, **kwargs):
        # If marked as primary resume, unmark any other primary resumes for this user
        if self.is_primary and self.doc_type == self.DocumentType.RESUME:
            Document.objects.filter(
                user=self.user,
                doc_type=self.DocumentType.RESUME,
                is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
