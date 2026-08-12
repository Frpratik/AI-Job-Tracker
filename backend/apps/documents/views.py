from django.http import FileResponse, Http404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.models import Application
from .models import Document
from .serializers import DocumentSerializer


def success(data=None, message=None, http_status=status.HTTP_200_OK):
    body = {"success": True}
    if data is not None:
        body["data"] = data
    if message:
        body["message"] = message
    return Response(body, status=http_status)


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        qs = Document.objects.filter(user=self.request.user).select_related("application__job__company")
        doc_type = self.request.query_params.get("doc_type")
        if doc_type:
            qs = qs.filter(doc_type=doc_type)
        app_id = self.request.query_params.get("application_id")
        if app_id:
            qs = qs.filter(application_id=app_id)
        is_primary = self.request.query_params.get("is_primary")
        if is_primary is not None:
            qs = qs.filter(is_primary=is_primary.lower() in ("true", "1"))
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success(data={"results": serializer.data, "count": len(serializer.data)})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(data=serializer.data, http_status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return success(data=serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return success(message="Document deleted successfully.", http_status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def set_primary(self, request, pk=None):
        doc = self.get_object()
        if doc.doc_type != Document.DocumentType.RESUME:
            return Response(
                {"success": False, "error": {"code": "INVALID_TYPE", "message": "Only resumes can be set as primary active resume."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        doc.is_primary = True
        doc.save()
        return success(data=self.get_serializer(doc).data)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        doc = self.get_object()
        if not doc.file:
            raise Http404("Document file does not exist.")
        response = FileResponse(doc.file.open("rb"), content_type=doc.mime_type)
        response["Content-Disposition"] = f'attachment; filename="{doc.title}"'
        return response


class ApplicationDocumentsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_application(self, pk, user):
        try:
            return Application.objects.get(pk=pk, user=user)
        except Application.DoesNotExist:
            raise Http404("Application not found.")

    def get(self, request, pk):
        app = self.get_application(pk, request.user)
        documents = Document.objects.filter(user=request.user, application=app)
        serializer = DocumentSerializer(documents, many=True, context={"request": request})
        return success(data=serializer.data)

    def post(self, request, pk):
        app = self.get_application(pk, request.user)
        serializer = DocumentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(application=app)
        return success(data=serializer.data, http_status=status.HTTP_201_CREATED)
