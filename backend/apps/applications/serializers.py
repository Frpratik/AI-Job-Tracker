from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import (
    Application,
    ApplicationStatusHistory,
    ApplicationTag,
    Communication,
    Company,
    Interview,
    Job,
    Note,
    Notification,
    Recruiter,
    Reminder,
    Tag,
)
from .services import record_initial_status, transition_status


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("id", "name", "website", "logo_url")
        read_only_fields = ("id",)


class JobSerializer(serializers.ModelSerializer):
    company = CompanySerializer()

    class Meta:
        model = Job
        fields = (
            "id",
            "company",
            "title",
            "external_id",
            "url",
            "location",
            "work_mode",
            "employment_type",
            "experience_level",
            "salary_min",
            "salary_max",
            "salary_currency",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        minimum = attrs.get("salary_min", getattr(self.instance, "salary_min", None))
        maximum = attrs.get("salary_max", getattr(self.instance, "salary_max", None))
        if minimum is not None and maximum is not None and minimum > maximum:
            raise serializers.ValidationError(
                {"salary_max": "Must be greater than minimum salary."}
            )
        return attrs


class StatusHistorySerializer(serializers.ModelSerializer):
    from_status_label = serializers.CharField(source="get_from_status_display", read_only=True)
    to_status_label = serializers.CharField(source="get_to_status_display", read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = (
            "id",
            "from_status",
            "from_status_label",
            "to_status",
            "to_status_label",
            "changed_at",
        )


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "color", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        value = value.strip()
        user = self.context["request"].user
        query = Tag.objects.filter(user=user, name__iexact=value)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError("You already have a tag with this name.")
        return value


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ("id", "body", "is_important", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class RecruiterSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), source="company", required=False, allow_null=True
    )

    class Meta:
        model = Recruiter
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "linkedin_url",
            "notes",
            "last_contact_date",
            "next_follow_up_date",
            "company_id",
            "company_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_company_id(self, value):
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Invalid company selected.")
        return value


class InterviewSerializer(serializers.ModelSerializer):
    interview_type_label = serializers.CharField(source="get_interview_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    company_name = serializers.CharField(source="application.job.company.name", read_only=True)
    job_title = serializers.CharField(source="application.job.title", read_only=True)
    application_id = serializers.UUIDField(source="application.id", read_only=True)

    class Meta:
        model = Interview
        fields = (
            "id",
            "application_id",
            "title",
            "round_number",
            "interview_type",
            "interview_type_label",
            "status",
            "status_label",
            "scheduled_at",
            "duration_minutes",
            "interviewer_name",
            "interviewer_email",
            "meeting_url",
            "location",
            "notes",
            "feedback",
            "company_name",
            "job_title",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CommunicationSerializer(serializers.ModelSerializer):
    channel_label = serializers.CharField(source="get_channel_display", read_only=True)
    direction_label = serializers.CharField(source="get_direction_display", read_only=True)
    recruiter_name = serializers.CharField(source="recruiter.name", read_only=True)
    recruiter_id = serializers.PrimaryKeyRelatedField(
        queryset=Recruiter.objects.all(), source="recruiter", required=False, allow_null=True
    )
    application_id = serializers.UUIDField(source="application.id", read_only=True)

    class Meta:
        model = Communication
        fields = (
            "id",
            "application_id",
            "recruiter_id",
            "recruiter_name",
            "channel",
            "channel_label",
            "direction",
            "direction_label",
            "summary",
            "details",
            "contact_date",
            "follow_up_date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_recruiter_id(self, value):
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Invalid recruiter selected.")
        return value


class ReminderSerializer(serializers.ModelSerializer):
    reminder_type_label = serializers.CharField(source="get_reminder_type_display", read_only=True)
    company_name = serializers.CharField(source="application.job.company.name", read_only=True)
    job_title = serializers.CharField(source="application.job.title", read_only=True)
    application_id = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(), source="application", required=False, allow_null=True
    )

    class Meta:
        model = Reminder
        fields = (
            "id",
            "application_id",
            "interview",
            "title",
            "reminder_type",
            "reminder_type_label",
            "due_at",
            "is_completed",
            "completed_at",
            "notes",
            "company_name",
            "job_title",
            "created_at",
        )
        read_only_fields = ("id", "completed_at", "created_at")

    def validate_application_id(self, value):
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Invalid application selected.")
        return value


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_label = serializers.CharField(source="get_notification_type_display", read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "title",
            "message",
            "notification_type",
            "notification_type_label",
            "related_application",
            "is_read",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class ApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    notes = NoteSerializer(many=True, read_only=True)
    interviews = InterviewSerializer(many=True, read_only=True)
    communications = CommunicationSerializer(many=True, read_only=True)
    reminders = ReminderSerializer(many=True, read_only=True)
    primary_recruiter = RecruiterSerializer(read_only=True)
    primary_recruiter_id = serializers.PrimaryKeyRelatedField(
        queryset=Recruiter.objects.all(),
        source="primary_recruiter",
        required=False,
        allow_null=True,
        write_only=True,
    )
    tags = serializers.SerializerMethodField()
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )

    documents = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id",
            "job",
            "status",
            "status_label",
            "applied_date",
            "source",
            "priority",
            "priority_label",
            "is_archived",
            "primary_recruiter",
            "primary_recruiter_id",
            "tags",
            "tag_ids",
            "notes",
            "interviews",
            "communications",
            "reminders",
            "documents",
            "status_history",
            "created_at",
            "updated_at",
        )

    def get_documents(self, obj):
        from apps.documents.serializers import DocumentSerializer
        docs = obj.documents.all()
        return DocumentSerializer(docs, many=True, context=self.context).data

        read_only_fields = ("id", "created_at", "updated_at")

    @extend_schema_field(TagSerializer(many=True))
    def get_tags(self, instance):
        tags = [link.tag for link in instance.tag_links.all()]
        return TagSerializer(tags, many=True).data

    def _company_for(self, user, data):
        company_data = data.copy()
        name = company_data.pop("name").strip()
        company = Company.objects.filter(user=user, name__iexact=name).first()
        if company is None:
            return Company.objects.create(user=user, name=name, **company_data)
        changed = False
        for field in ("website", "logo_url"):
            value = company_data.get(field)
            if value and getattr(company, field) != value:
                setattr(company, field, value)
                changed = True
        if changed:
            company.save(update_fields=("website", "logo_url", "updated_at"))
        return company

    def _set_tags(self, application, tag_ids):
        tags = list(Tag.objects.filter(user=application.user, id__in=tag_ids))
        if len(tags) != len(set(tag_ids)):
            raise serializers.ValidationError({"tag_ids": "One or more tags are invalid."})
        ApplicationTag.objects.filter(application=application).delete()
        ApplicationTag.objects.bulk_create(
            [ApplicationTag(application=application, tag=tag) for tag in tags]
        )
        cache = getattr(application, "_prefetched_objects_cache", {})
        cache.pop("tag_links", None)

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        job_data = validated_data.pop("job")
        company_data = job_data.pop("company")
        tag_ids = validated_data.pop("tag_ids", [])
        company = self._company_for(user, company_data)
        job = Job(user=user, company=company, **job_data)
        job.full_clean()
        job.save()
        application = Application(user=user, job=job, **validated_data)
        application.full_clean()
        application.save()
        record_initial_status(application)
        self._set_tags(application, tag_ids)
        return application

    @transaction.atomic
    def update(self, instance, validated_data):
        job_data = validated_data.pop("job", None)
        tag_ids = validated_data.pop("tag_ids", None)
        new_status = validated_data.pop("status", None)
        if job_data:
            company_data = job_data.pop("company", None)
            if company_data:
                instance.job.company = self._company_for(instance.user, company_data)
            for field, value in job_data.items():
                setattr(instance.job, field, value)
            instance.job.full_clean()
            instance.job.save()
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.full_clean()
        instance.save()
        if new_status is not None:
            instance = transition_status(instance, new_status)
        if tag_ids is not None:
            self._set_tags(instance, tag_ids)
        return instance


class StatusTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Application.Status.choices)


class ConvertWishlistSerializer(serializers.Serializer):
    applied_date = serializers.DateField(required=False)
    source = serializers.CharField(max_length=80, required=False, allow_blank=True)


class DashboardSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    active = serializers.IntegerField()
    interviews = serializers.IntegerField()
    offers = serializers.IntegerField()
    rejected = serializers.IntegerField()
    saved_jobs = serializers.IntegerField()
    funnel = serializers.DictField(child=serializers.IntegerField())
    upcoming_interviews = InterviewSerializer(many=True)
    pending_reminders = ReminderSerializer(many=True)
    recent = ApplicationSerializer(many=True)

