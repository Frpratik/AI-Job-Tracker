from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response

from .models import Application, Note, Tag
from .serializers import (
    ApplicationSerializer,
    DashboardSerializer,
    NoteSerializer,
    StatusTransitionSerializer,
    TagSerializer,
)
from .services import transition_status


def success(data=None, message=None, http_status=status.HTTP_200_OK):
    body = {"success": True}
    if data is not None:
        body["data"] = data
    if message:
        body["message"] = message
    return Response(body, status=http_status)


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    lookup_value_converter = "uuid"

    def get_queryset(self):
        query = (
            Application.objects.filter(user=self.request.user)
            .select_related("job", "job__company")
            .prefetch_related("status_history", "notes", "tag_links__tag")
        )
        params = self.request.query_params
        search = params.get("search", "").strip()
        if search:
            query = query.filter(
                Q(job__title__icontains=search)
                | Q(job__company__name__icontains=search)
                | Q(job__location__icontains=search)
                | Q(source__icontains=search)
                | Q(notes__body__icontains=search)
            ).distinct()
        statuses = [value for value in params.get("status", "").split(",") if value]
        if statuses:
            query = query.filter(status__in=statuses)
        if priority := params.get("priority"):
            query = query.filter(priority=priority)
        if work_mode := params.get("work_mode"):
            query = query.filter(job__work_mode=work_mode)
        archived = params.get("archived", "false").lower() == "true"
        query = query.filter(is_archived=archived)
        orderings = {
            "newest": "-created_at",
            "oldest": "created_at",
            "updated": "-updated_at",
            "salary": "-job__salary_max",
        }
        return query.order_by(orderings.get(params.get("sort", "updated"), "-updated_at"))

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page if page is not None else queryset, many=True)
        if page is not None:
            paginated = self.get_paginated_response(serializer.data).data
            return success(paginated)
        return success(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return success(
            self.get_serializer(application).data,
            message="Application added.",
            http_status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return success(self.get_serializer(application).data, message="Application updated.")

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=("patch",), url_path="status")
    def change_status(self, request, pk=None):
        serializer = StatusTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = transition_status(self.get_object(), serializer.validated_data["status"])
        return success(self.get_serializer(application).data, message="Status updated.")

    @action(detail=True, methods=("post",))
    def archive(self, request, pk=None):
        application = self.get_object()
        application.is_archived = True
        application.save(update_fields=("is_archived", "updated_at"))
        return success(self.get_serializer(application).data, message="Application archived.")


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    lookup_value_converter = "uuid"

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ApplicationNotesView(ListCreateAPIView):
    serializer_class = NoteSerializer

    def application(self):
        return get_object_or_404(
            Application, pk=self.kwargs["application_id"], user=self.request.user
        )

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user, application=self.application())

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, application=self.application())

    def list(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(serializer.data, http_status=status.HTTP_201_CREATED)


class NoteDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)


@extend_schema(responses=DashboardSerializer)
class DashboardView(GenericAPIView):
    serializer_class = DashboardSerializer

    def get(self, request, *args, **kwargs):
        applications = Application.objects.filter(user=request.user, is_archived=False)
        counts = applications.aggregate(
            total=Count("id"),
            active=Count(
                "id",
                filter=~Q(
                    status__in=(
                        Application.Status.REJECTED,
                        Application.Status.WITHDRAWN,
                        Application.Status.ACCEPTED,
                    )
                ),
            ),
            interviews=Count(
                "id",
                filter=Q(
                    status__in=(
                        Application.Status.TECHNICAL_INTERVIEW,
                        Application.Status.HR_INTERVIEW,
                        Application.Status.FINAL_INTERVIEW,
                    )
                ),
            ),
            offers=Count(
                "id", filter=Q(status__in=(Application.Status.OFFER, Application.Status.ACCEPTED))
            ),
            rejected=Count("id", filter=Q(status=Application.Status.REJECTED)),
        )
        funnel = {
            key: applications.filter(status=value).count()
            for key, value in (
                ("applied", Application.Status.APPLIED),
                ("screening", Application.Status.SCREENING),
                ("interview", Application.Status.TECHNICAL_INTERVIEW),
                ("final", Application.Status.FINAL_INTERVIEW),
                ("offer", Application.Status.OFFER),
            )
        }
        recent = applications.select_related("job", "job__company").prefetch_related(
            "status_history", "notes", "tag_links__tag"
        )[:5]
        data = {**counts, "funnel": funnel, "recent": ApplicationSerializer(recent, many=True).data}
        return success(data)
