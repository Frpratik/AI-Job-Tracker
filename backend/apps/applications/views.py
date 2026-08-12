from datetime import date, datetime, time, timedelta

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import (
    GenericAPIView,
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Application,
    Communication,
    Interview,
    Note,
    Notification,
    Recruiter,
    Reminder,
    Tag,
)
from .serializers import (
    ApplicationSerializer,
    CommunicationSerializer,
    ConvertWishlistSerializer,
    DashboardSerializer,
    InterviewSerializer,
    NoteSerializer,
    NotificationSerializer,
    RecruiterSerializer,
    ReminderSerializer,
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
            .select_related("job", "job__company", "primary_recruiter", "primary_recruiter__company")
            .prefetch_related(
                "status_history",
                "notes",
                "tag_links__tag",
                "interviews",
                "communications",
                "communications__recruiter",
                "reminders",
            )
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

    @action(detail=True, methods=("post",), url_path="convert")
    def convert_wishlist(self, request, pk=None):
        application = self.get_object()
        serializer = ConvertWishlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        applied_date = serializer.validated_data.get("applied_date", date.today())
        source = serializer.validated_data.get("source", application.source)
        application.applied_date = applied_date
        application.source = source
        application.save(update_fields=("applied_date", "source", "updated_at"))
        application = transition_status(application, Application.Status.APPLIED)
        return success(
            self.get_serializer(application).data,
            message="Saved job converted to active application.",
        )

    @action(detail=True, methods=("post",))
    def archive(self, request, pk=None):
        application = self.get_object()
        application.is_archived = True
        application.save(update_fields=("is_archived", "updated_at"))
        return success(self.get_serializer(application).data, message="Application archived.")


class RecruiterViewSet(viewsets.ModelViewSet):
    serializer_class = RecruiterSerializer
    lookup_value_converter = "uuid"

    def get_queryset(self):
        query = Recruiter.objects.filter(user=self.request.user).select_related("company")
        search = self.request.query_params.get("search", "").strip()
        if search:
            query = query.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(company__name__icontains=search)
            )
        return query

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(
            page if page is not None else self.get_queryset(), many=True
        )
        if page is not None:
            return success(self.get_paginated_response(serializer.data).data)
        return success(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(serializer.data, http_status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=kwargs.pop("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success(serializer.data)

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    lookup_value_converter = "uuid"

    def get_queryset(self):
        query = (
            Interview.objects.filter(user=self.request.user)
            .select_related("application", "application__job", "application__job__company")
        )
        status_param = self.request.query_params.get("status")
        if status_param:
            query = query.filter(status=status_param)
        return query

    def list(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_queryset(), many=True).data)

    def retrieve(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=kwargs.pop("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success(serializer.data)

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApplicationInterviewsView(ListCreateAPIView):
    serializer_class = InterviewSerializer

    def application(self):
        return get_object_or_404(
            Application, pk=self.kwargs["application_id"], user=self.request.user
        )

    def get_queryset(self):
        return Interview.objects.filter(
            user=self.request.user, application=self.application()
        ).select_related("application", "application__job", "application__job__company")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, application=self.application())

    def list(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(serializer.data, http_status=status.HTTP_201_CREATED)


class CommunicationViewSet(viewsets.ModelViewSet):
    serializer_class = CommunicationSerializer
    lookup_value_converter = "uuid"

    def get_queryset(self):
        return (
            Communication.objects.filter(user=self.request.user)
            .select_related("application", "recruiter")
        )

    def list(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_queryset(), many=True).data)

    def retrieve(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=kwargs.pop("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success(serializer.data)

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApplicationCommunicationsView(ListCreateAPIView):
    serializer_class = CommunicationSerializer

    def application(self):
        return get_object_or_404(
            Application, pk=self.kwargs["application_id"], user=self.request.user
        )

    def get_queryset(self):
        return (
            Communication.objects.filter(
                user=self.request.user, application=self.application()
            ).select_related("recruiter")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, application=self.application())

    def list(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(serializer.data, http_status=status.HTTP_201_CREATED)


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    lookup_value_converter = "uuid"

    def get_queryset(self):
        query = (
            Reminder.objects.filter(user=self.request.user)
            .select_related("application", "application__job", "application__job__company")
        )
        params = self.request.query_params
        if params.get("completed") is not None:
            query = query.filter(is_completed=params.get("completed").lower() == "true")
        if filter_type := params.get("filter"):
            now = timezone.now()
            if filter_type == "today":
                start = datetime.combine(now.date(), time.min).replace(tzinfo=now.tzinfo)
                end = datetime.combine(now.date(), time.max).replace(tzinfo=now.tzinfo)
                query = query.filter(due_at__range=(start, end))
            elif filter_type == "upcoming":
                query = query.filter(is_completed=False, due_at__gte=now)
            elif filter_type == "overdue":
                query = query.filter(is_completed=False, due_at__lt=now)
        return query

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(serializer.data, http_status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=kwargs.pop("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success(serializer.data)

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=("post",), url_path="toggle")
    def toggle_complete(self, request, pk=None):
        reminder = self.get_object()
        reminder.is_completed = not reminder.is_completed
        reminder.completed_at = timezone.now() if reminder.is_completed else None
        reminder.save(update_fields=("is_completed", "completed_at", "updated_at"))
        return success(self.get_serializer(reminder).data)


class NotificationViewSet(ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_queryset(), many=True).data)

    @action(detail=False, methods=("post",), url_path="mark-all-read")
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return success(message="All notifications marked as read.")


class CalendarEventsView(APIView):
    def get(self, request):
        user = request.user
        now = timezone.now()
        start = request.query_params.get("start")
        end = request.query_params.get("end")

        start_dt = datetime.fromisoformat(start) if start else now - timedelta(days=14)
        end_dt = datetime.fromisoformat(end) if end else now + timedelta(days=60)

        interviews = Interview.objects.filter(
            user=user, scheduled_at__range=(start_dt, end_dt)
        ).select_related("application", "application__job", "application__job__company")

        reminders = Reminder.objects.filter(
            user=user, due_at__range=(start_dt, end_dt)
        ).select_related("application", "application__job", "application__job__company")

        events = []
        for i in interviews:
            events.append(
                {
                    "id": str(i.id),
                    "event_type": "interview",
                    "title": i.title,
                    "subtitle": f"{i.application.job.company.name} • {i.get_interview_type_display()}",
                    "date_time": i.scheduled_at.isoformat(),
                    "status": i.status,
                    "duration_minutes": i.duration_minutes,
                    "meeting_url": i.meeting_url,
                    "application_id": str(i.application_id),
                    "company_name": i.application.job.company.name,
                    "job_title": i.application.job.title,
                }
            )

        for r in reminders:
            company = r.application.job.company.name if r.application else "General"
            events.append(
                {
                    "id": str(r.id),
                    "event_type": "reminder",
                    "title": r.title,
                    "subtitle": f"{company} • {r.get_reminder_type_display()}",
                    "date_time": r.due_at.isoformat(),
                    "is_completed": r.is_completed,
                    "reminder_type": r.reminder_type,
                    "application_id": str(r.application_id) if r.application_id else None,
                    "company_name": company,
                }
            )

        events.sort(key=lambda x: x["date_time"])
        return success(events)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    lookup_value_converter = "uuid"

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(
            page if page is not None else self.get_queryset(), many=True
        )
        if page is not None:
            return success(self.get_paginated_response(serializer.data).data)
        return success(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(serializer.data, http_status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=kwargs.pop("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success(serializer.data)

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
                        Application.Status.WISHLIST,
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
            saved_jobs=Count("id", filter=Q(status=Application.Status.WISHLIST)),
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
        recent = applications.exclude(status=Application.Status.WISHLIST).select_related(
            "job", "job__company", "primary_recruiter"
        ).prefetch_related(
            "status_history", "notes", "tag_links__tag", "interviews", "reminders"
        )[:5]

        now = timezone.now()
        upcoming_interviews = (
            Interview.objects.filter(user=request.user, scheduled_at__gte=now, status="scheduled")
            .select_related("application", "application__job", "application__job__company")
            .order_by("scheduled_at")[:5]
        )

        pending_reminders = (
            Reminder.objects.filter(user=request.user, is_completed=False)
            .select_related("application", "application__job", "application__job__company")
            .order_by("due_at")[:5]
        )

        data = {
            **counts,
            "funnel": funnel,
            "upcoming_interviews": InterviewSerializer(upcoming_interviews, many=True).data,
            "pending_reminders": ReminderSerializer(pending_reminders, many=True).data,
            "recent": ApplicationSerializer(recent, many=True).data,
        }
        return success(data)
