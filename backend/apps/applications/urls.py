from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ApplicationCommunicationsView,
    ApplicationInterviewsView,
    ApplicationNotesView,
    ApplicationViewSet,
    CalendarEventsView,
    CommunicationViewSet,
    DashboardView,
    InterviewViewSet,
    NoteDetailView,
    NotificationViewSet,
    RecruiterViewSet,
    ReminderViewSet,
    TagViewSet,
)
from .views_analytics import AnalyticsView, ExportCSVView, ExportJSONView

router = DefaultRouter(use_regex_path=False)
router.register("applications", ApplicationViewSet, basename="application")
router.register("recruiters", RecruiterViewSet, basename="recruiter")
router.register("interviews", InterviewViewSet, basename="interview")
router.register("communications", CommunicationViewSet, basename="communication")
router.register("reminders", ReminderViewSet, basename="reminder")
router.register("tags", TagViewSet, basename="tag")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("calendar/", CalendarEventsView.as_view(), name="calendar-events"),
    path("notifications/", NotificationViewSet.as_view(), name="notifications"),
    path("analytics/", AnalyticsView.as_view(), name="analytics"),
    path("analytics/export/csv/", ExportCSVView.as_view(), name="analytics-export-csv"),
    path("analytics/export/json/", ExportJSONView.as_view(), name="analytics-export-json"),
    path(
        "applications/<uuid:application_id>/notes/",
        ApplicationNotesView.as_view(),
        name="application-notes",
    ),
    path(
        "applications/<uuid:application_id>/interviews/",
        ApplicationInterviewsView.as_view(),
        name="application-interviews",
    ),
    path(
        "applications/<uuid:application_id>/communications/",
        ApplicationCommunicationsView.as_view(),
        name="application-communications",
    ),
    path("notes/<uuid:pk>/", NoteDetailView.as_view(), name="note-detail"),
    *router.urls,
]
