from django.urls import path
from .views import CancelSubscriptionView, SubscriptionDetailView, UpgradePlanView

urlpatterns = [
    path("billing/subscription/", SubscriptionDetailView.as_view(), name="billing-subscription"),
    path("billing/upgrade/", UpgradePlanView.as_view(), name="billing-upgrade"),
    path("billing/cancel/", CancelSubscriptionView.as_view(), name="billing-cancel"),
]
