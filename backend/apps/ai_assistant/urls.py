from django.urls import path
from .views import ATSScanView, CoverLetterGeneratorView, InterviewPrepView

urlpatterns = [
    path("ai/ats-scan/", ATSScanView.as_view(), name="ai-ats-scan"),
    path("ai/cover-letter/", CoverLetterGeneratorView.as_view(), name="ai-cover-letter"),
    path("ai/interview-prep/", InterviewPrepView.as_view(), name="ai-interview-prep"),
]
