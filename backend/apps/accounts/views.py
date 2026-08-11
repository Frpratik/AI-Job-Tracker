from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from .models import Profile, User
from .serializers import (
    EmailTokenSerializer,
    EmptySerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
    token_pair_for_user,
)


def success(data=None, message=None, http_status=status.HTTP_200_OK):
    body = {"success": True}
    if data is not None:
        body["data"] = data
    if message:
        body["message"] = message
    return Response(body, status=http_status)


class AuthThrottledView(GenericAPIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class RegisterView(AuthThrottledView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @extend_schema(responses={201: UserSerializer})
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success(
            {"user": UserSerializer(user).data, "tokens": token_pair_for_user(user)},
            http_status=status.HTTP_201_CREATED,
        )


class LoginView(AuthThrottledView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        Profile.objects.get_or_create(user=user)
        return success({"user": UserSerializer(user).data, "tokens": token_pair_for_user(user)})


class LogoutView(GenericAPIView):
    serializer_class = LogoutSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            pass
        return success(message="Signed out successfully.")


class RefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return success(response.data)


class MeView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        Profile.objects.get_or_create(user=self.request.user)
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        return success(self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success(serializer.data)


class EmailVerificationRequestView(AuthThrottledView):
    serializer_class = EmptySerializer

    def post(self, request):
        user = request.user
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        send_mail(
            "Verify your JobTracker email",
            f"Verification code: {uid}:{token}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
        return success(message="If delivery is available, a verification email has been sent.")


class EmailVerificationConfirmView(AuthThrottledView):
    permission_classes = [AllowAny]
    serializer_class = EmailTokenSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(
                pk=force_str(urlsafe_base64_decode(serializer.validated_data["uid"]))
            )
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if user is None or not default_token_generator.check_token(
            user, serializer.validated_data["token"]
        ):
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "The verification link is invalid or expired.",
                        "fields": None,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified", "updated_at"])
        return success(message="Email verified successfully.")


class PasswordResetRequestView(AuthThrottledView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(
            email=serializer.validated_data["email"].strip().lower(), is_active=True
        ).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            send_mail(
                "Reset your JobTracker password",
                f"Password reset code: {uid}:{token}",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        return success(message="If an account exists, password reset instructions have been sent.")


class PasswordResetConfirmView(AuthThrottledView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(
                pk=force_str(urlsafe_base64_decode(serializer.validated_data["uid"]))
            )
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if user is None or not default_token_generator.check_token(
            user, serializer.validated_data["token"]
        ):
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "The reset link is invalid or expired.",
                        "fields": None,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password", "updated_at"])
        return success(message="Password updated successfully.")
