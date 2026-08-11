from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ApplicationNotesView,
    ApplicationViewSet,
    DashboardView,
    NoteDetailView,
    TagViewSet,
)

router = DefaultRouter(use_regex_path=False)
router.register("applications", ApplicationViewSet, basename="application")
router.register("tags", TagViewSet, basename="tag")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path(
        "applications/<uuid:application_id>/notes/",
        ApplicationNotesView.as_view(),
        name="application-notes",
    ),
    path("notes/<uuid:pk>/", NoteDetailView.as_view(), name="note-detail"),
    *router.urls,
]
