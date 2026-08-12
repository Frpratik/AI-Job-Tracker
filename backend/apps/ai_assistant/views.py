from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.models import Application
from apps.documents.models import Document
from .services.ai_engine import (
    generate_cover_letter,
    generate_interview_prep,
    scan_ats_match,
)


def success(data=None, message=None, http_status=status.HTTP_200_OK):
    body = {"success": True}
    if data is not None:
        body["data"] = data
    if message:
        body["message"] = message
    return Response(body, status=http_status)


class ATSScanView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        resume_text = request.data.get("resume_text", "")
        resume_id = request.data.get("resume_id")
        job_description = request.data.get("job_description", "")
        job_title = request.data.get("job_title", "Software Engineer")
        application_id = request.data.get("application_id")

        if resume_id:
            try:
                doc = Document.objects.get(pk=resume_id, user=request.user)
                if doc.parsed_text:
                    resume_text = doc.parsed_text
                else:
                    resume_text = doc.title
            except Document.DoesNotExist:
                pass

        if not resume_text:
            # Check user's primary resume
            primary_doc = Document.objects.filter(user=request.user, is_primary=True).first()
            if primary_doc and primary_doc.parsed_text:
                resume_text = primary_doc.parsed_text

        if application_id:
            try:
                app = Application.objects.get(pk=application_id, user=request.user)
                if app.job:
                    job_title = app.job.title
                    if not job_description:
                        job_description = f"{app.job.title} at {app.job.company.name if app.job.company else ''}. Work mode: {app.job.work_mode}. Location: {app.job.location}."
            except Application.DoesNotExist:
                pass

        result = scan_ats_match(resume_text, job_description, job_title)
        return success(data=result)


class CoverLetterGeneratorView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        job_title = request.data.get("job_title", "Senior Software Engineer")
        company_name = request.data.get("company_name", "Target Company")
        job_description = request.data.get("job_description", "")
        tone = request.data.get("tone", "professional")
        application_id = request.data.get("application_id")
        resume_text = request.data.get("resume_text", "")

        if application_id:
            try:
                app = Application.objects.get(pk=application_id, user=request.user)
                if app.job:
                    job_title = app.job.title
                    if app.job.company:
                        company_name = app.job.company.name
            except Application.DoesNotExist:
                pass

        candidate_name = request.user.full_name or request.user.email.split("@")[0]
        experience = "cloud platform engineering, distributed microservices, and modern web application development"

        result = generate_cover_letter(
            candidate_name=candidate_name,
            candidate_experience=experience,
            resume_text=resume_text,
            job_title=job_title,
            company_name=company_name,
            job_description=job_description,
            tone=tone,
        )
        return success(data=result)


class InterviewPrepView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        job_title = request.data.get("job_title", "Software Engineer")
        company_name = request.data.get("company_name", "Innovative Tech Co")
        job_description = request.data.get("job_description", "")
        interview_type = request.data.get("interview_type", "technical")
        application_id = request.data.get("application_id")

        if application_id:
            try:
                app = Application.objects.get(pk=application_id, user=request.user)
                if app.job:
                    job_title = app.job.title
                    if app.job.company:
                        company_name = app.job.company.name
            except Application.DoesNotExist:
                pass

        result = generate_interview_prep(
            job_title=job_title,
            company_name=company_name,
            job_description=job_description,
            interview_type=interview_type,
        )
        return success(data=result)
