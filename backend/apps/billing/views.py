from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Subscription
from .serializers import SubscriptionSerializer


def success(data=None, message=None, http_status=status.HTTP_200_OK):
    body = {"success": True}
    if data is not None:
        body["data"] = data
    if message:
        body["message"] = message
    return Response(body, status=http_status)


class SubscriptionDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        sub, _ = Subscription.objects.get_or_create(user=request.user)
        serializer = SubscriptionSerializer(sub)
        return success(data=serializer.data)


class UpgradePlanView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        sub, _ = Subscription.objects.get_or_create(user=request.user)
        yearly = request.data.get("yearly", False) or request.data.get("plan") == "pro_yearly"

        # Upgrades to Pro Career Intelligence
        sub.upgrade_to_pro(yearly=yearly)
        serializer = SubscriptionSerializer(sub)
        return success(
            data=serializer.data,
            message="Welcome to JobTracker Pro! All entitlements and unlimited AI features have been activated.",
        )


class CancelSubscriptionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        sub, _ = Subscription.objects.get_or_create(user=request.user)
        sub.cancel_subscription()
        serializer = SubscriptionSerializer(sub)
        return success(
            data=serializer.data,
            message="Your Pro subscription has been canceled. Your account is now on the Free Starter plan.",
        )
