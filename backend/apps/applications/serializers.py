from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import (
    Application,
    ApplicationStatusHistory,
    ApplicationTag,
    Company,
    Job,
    Note,
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


class ApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    notes = NoteSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )

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
            "tags",
            "tag_ids",
            "notes",
            "status_history",
            "created_at",
            "updated_at",
        )
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


class DashboardSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    active = serializers.IntegerField()
    interviews = serializers.IntegerField()
    offers = serializers.IntegerField()
    rejected = serializers.IntegerField()
    funnel = serializers.DictField(child=serializers.IntegerField())
    recent = ApplicationSerializer(many=True)
