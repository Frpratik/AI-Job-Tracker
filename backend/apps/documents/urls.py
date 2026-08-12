from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ApplicationDocumentsView, DocumentViewSet

router = DefaultRouter()
router.register(r"documents", DocumentViewSet, basename="document")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "applications/<uuid:pk>/documents/",
        ApplicationDocumentsView.as_view(),
        name="application-documents",
    ),
]
