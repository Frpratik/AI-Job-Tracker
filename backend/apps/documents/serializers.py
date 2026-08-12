import os
from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    doc_type_label = serializers.CharField(source="get_doc_type_display", read_only=True)
    formatted_file_size = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    application_company = serializers.SerializerMethodField()
    application_title = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = (
            "id",
            "application",
            "application_company",
            "application_title",
            "title",
            "doc_type",
            "doc_type_label",
            "file",
            "file_url",
            "file_size_bytes",
            "formatted_file_size",
            "mime_type",
            "is_primary",
            "version_number",
            "parsed_text",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "file_size_bytes",
            "mime_type",
            "created_at",
            "updated_at",
        )

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def get_formatted_file_size(self, obj):
        size = obj.file_size_bytes
        if not size:
            return "0 KB"
        if size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        return f"{size / (1024 * 1024):.2f} MB"

    def get_application_company(self, obj):
        if obj.application and obj.application.job and obj.application.job.company:
            return obj.application.job.company.name
        return None

    def get_application_title(self, obj):
        if obj.application and obj.application.job:
            return obj.application.job.title
        return None

    def validate_file(self, value):
        max_size = 15 * 1024 * 1024  # 15MB
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 15MB.")

        ext = os.path.splitext(value.name)[1].lower()
        allowed_exts = {".pdf", ".docx", ".doc", ".txt", ".rtf", ".png", ".jpg", ".jpeg"}
        if ext not in allowed_exts:
            raise serializers.ValidationError(
                f"Unsupported file extension '{ext}'. Allowed: PDF, DOCX, DOC, TXT, RTF, PNG, JPG."
            )
        return value

    def create(self, validated_data):
        file = validated_data.get("file")
        if file:
            validated_data["file_size_bytes"] = file.size
            content_type = getattr(file, "content_type", None)
            if content_type:
                validated_data["mime_type"] = content_type
            else:
                ext = os.path.splitext(file.name)[1].lower()
                if ext == ".pdf":
                    validated_data["mime_type"] = "application/pdf"
                elif ext in (".docx", ".doc"):
                    validated_data["mime_type"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                else:
                    validated_data["mime_type"] = "application/octet-stream"

        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
