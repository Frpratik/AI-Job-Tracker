from rest_framework import serializers
from apps.applications.models import Application
from apps.documents.models import Document
from .models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_label = serializers.CharField(source="get_plan_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    is_pro = serializers.BooleanField(read_only=True)
    max_applications = serializers.IntegerField(read_only=True)
    max_ai_scans = serializers.IntegerField(read_only=True)
    max_cover_letters = serializers.IntegerField(read_only=True)
    max_resumes = serializers.IntegerField(read_only=True)
    current_application_count = serializers.SerializerMethodField()
    current_resume_count = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = (
            "id",
            "plan",
            "plan_label",
            "status",
            "status_label",
            "is_pro",
            "ai_scans_used_this_month",
            "cover_letters_used_this_month",
            "max_applications",
            "max_ai_scans",
            "max_cover_letters",
            "max_resumes",
            "current_application_count",
            "current_resume_count",
            "current_period_end",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "plan",
            "status",
            "ai_scans_used_this_month",
            "cover_letters_used_this_month",
            "current_period_end",
            "created_at",
            "updated_at",
        )

    def get_current_application_count(self, obj):
        return Application.objects.filter(user=obj.user, is_archived=False).exclude(status=Application.Status.WISHLIST).count()

    def get_current_resume_count(self, obj):
        return Document.objects.filter(user=obj.user, doc_type=Document.DocumentType.RESUME).count()
