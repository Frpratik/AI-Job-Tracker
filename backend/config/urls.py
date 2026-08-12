from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from config.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.applications.urls")),
    path("api/v1/", include("apps.documents.urls")),
    path("api/v1/", include("apps.ai_assistant.urls")),
    path("api/v1/", include("apps.billing.urls")),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
