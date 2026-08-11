from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def _field_errors(data):
    if not isinstance(data, dict):
        return None
    return {key: value for key, value in data.items() if key not in {"detail", "code"}}


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred.",
                    "fields": None,
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    code = getattr(exc, "default_code", "request_error")
    if isinstance(code, str):
        code = code.upper()
    detail = response.data.get("detail") if isinstance(response.data, dict) else None
    if isinstance(detail, (list, dict)):
        detail = None
    response.data = {
        "success": False,
        "error": {
            "code": code,
            "message": str(detail or "Unable to process the request."),
            "fields": _field_errors(response.data),
        },
    }
    return response
