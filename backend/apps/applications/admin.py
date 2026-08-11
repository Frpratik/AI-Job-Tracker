from django.contrib import admin

from .models import Application, ApplicationStatusHistory, ApplicationTag, Company, Job, Note, Tag

admin.site.register(
    (Company, Job, Application, ApplicationStatusHistory, Note, Tag, ApplicationTag)
)
