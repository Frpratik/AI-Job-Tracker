import csv
import io
from django.http import HttpResponse, JsonResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.models import Application
from apps.applications.serializers import ApplicationSerializer
from .analytics_service import get_analytics_data


def success(data=None, message=None, http_status=status.HTTP_200_OK):
    body = {"success": True}
    if data is not None:
        body["data"] = data
    if message:
        body["message"] = message
    return Response(body, status=http_status)


class AnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        timeframe = request.query_params.get("timeframe", "all")
        data = get_analytics_data(request.user, timeframe=timeframe)
        return success(data=data)


class ExportCSVView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        applications = (
            Application.objects.filter(user=request.user)
            .select_related("job", "job__company", "primary_recruiter")
            .prefetch_related("interviews", "communications")
            .order_by("-created_at")
        )

        output = io.StringIO()
        writer = csv.writer(output)
        # Header row
        writer.writerow([
            "Application ID",
            "Company",
            "Job Title",
            "Status",
            "Priority",
            "Work Mode",
            "Location",
            "Discovery Source",
            "Applied Date",
            "Salary Min",
            "Salary Max",
            "Interviews Count",
            "Primary Recruiter",
            "Recruiter Email",
            "Created At",
        ])

        for app in applications:
            writer.writerow([
                str(app.id),
                app.job.company.name if app.job and app.job.company else "",
                app.job.title if app.job else "",
                app.get_status_display(),
                app.get_priority_display(),
                app.job.work_mode if app.job else "",
                app.job.location if app.job else "",
                app.source or "",
                str(app.applied_date) if app.applied_date else "",
                str(app.job.salary_min) if app.job and app.job.salary_min else "",
                str(app.job.salary_max) if app.job and app.job.salary_max else "",
                app.interviews.count(),
                app.primary_recruiter.name if app.primary_recruiter else "",
                app.primary_recruiter.email if app.primary_recruiter else "",
                app.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            ])

        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="job_tracker_applications.csv"'
        return response


class ExportJSONView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        applications = (
            Application.objects.filter(user=request.user)
            .select_related("job", "job__company", "primary_recruiter")
            .prefetch_related("interviews", "communications", "reminders", "notes", "status_history")
            .order_by("-created_at")
        )
        serializer = ApplicationSerializer(applications, many=True, context={"request": request})

        payload = {
            "export_version": "1.0.0",
            "user": {
                "email": request.user.email,
                "full_name": request.user.full_name,
            },
            "total_applications": applications.count(),
            "applications": serializer.data,
        }

        response = JsonResponse(payload, json_dumps_params={"indent": 2})
        response["Content-Disposition"] = 'attachment; filename="job_tracker_backup.json"'
        return response
