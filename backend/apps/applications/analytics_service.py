from datetime import date, timedelta
from django.db.models import Avg, Count, Q
from django.utils import timezone

from apps.applications.models import Application, Communication, Interview


def get_analytics_data(user, timeframe="all"):
    now = timezone.now().date()
    apps_qs = Application.objects.filter(user=user).select_related("job", "job__company")

    # Timeframe filter
    if timeframe == "30d":
        apps_qs = apps_qs.filter(
            Q(applied_date__gte=now - timedelta(days=30)) | Q(created_at__date__gte=now - timedelta(days=30))
        )
    elif timeframe == "90d":
        apps_qs = apps_qs.filter(
            Q(applied_date__gte=now - timedelta(days=90)) | Q(created_at__date__gte=now - timedelta(days=90))
        )
    elif timeframe == "1y":
        apps_qs = apps_qs.filter(
            Q(applied_date__gte=now - timedelta(days=365)) | Q(created_at__date__gte=now - timedelta(days=365))
        )

    # 1. Funnel & Status Metrics
    total_tracked = apps_qs.count()
    wishlist_count = apps_qs.filter(status=Application.Status.WISHLIST).count()
    applied_count = apps_qs.exclude(status=Application.Status.WISHLIST).count()

    screening_count = apps_qs.filter(
        status__in=(
            Application.Status.SCREENING,
            Application.Status.TECHNICAL_INTERVIEW,
            Application.Status.HR_INTERVIEW,
            Application.Status.FINAL_INTERVIEW,
            Application.Status.OFFER,
            Application.Status.ACCEPTED,
        )
    ).count()

    interview_count = apps_qs.filter(
        status__in=(
            Application.Status.TECHNICAL_INTERVIEW,
            Application.Status.HR_INTERVIEW,
            Application.Status.FINAL_INTERVIEW,
            Application.Status.OFFER,
            Application.Status.ACCEPTED,
        )
    ).count()

    offer_count = apps_qs.filter(
        status__in=(Application.Status.OFFER, Application.Status.ACCEPTED)
    ).count()

    accepted_count = apps_qs.filter(status=Application.Status.ACCEPTED).count()
    rejected_count = apps_qs.filter(status=Application.Status.REJECTED).count()
    withdrawn_count = apps_qs.filter(status=Application.Status.WITHDRAWN).count()

    # Conversion Rates
    interview_rate_pct = round((interview_count / applied_count * 100), 1) if applied_count > 0 else 0.0
    offer_rate_pct = round((offer_count / applied_count * 100), 1) if applied_count > 0 else 0.0
    interview_to_offer_pct = round((offer_count / interview_count * 100), 1) if interview_count > 0 else 0.0

    # 2. Response Time Velocity (Days from applied_date to first interview or communication)
    response_days_list = []
    for app in apps_qs.exclude(status=Application.Status.WISHLIST):
        if not app.applied_date:
            continue
        first_interview = app.interviews.order_by("scheduled_at").first()
        first_comm = app.communications.order_by("contact_date").first()

        first_event_date = None
        if first_interview and first_comm:
            first_event_date = min(first_interview.scheduled_at.date(), first_comm.contact_date.date())
        elif first_interview:
            first_event_date = first_interview.scheduled_at.date()
        elif first_comm:
            first_event_date = first_comm.contact_date.date()

        if first_event_date and first_event_date >= app.applied_date:
            days = (first_event_date - app.applied_date).days
            response_days_list.append(days)

    avg_response_days = round(sum(response_days_list) / len(response_days_list), 1) if response_days_list else 0.0

    # 3. Discovery Source ROI
    sources = ["LinkedIn", "Referral", "Company Website", "Indeed", "Wellfound", "Other"]
    source_stats = []
    for src in sources:
        src_apps = apps_qs.filter(source=src).exclude(status=Application.Status.WISHLIST)
        src_total = src_apps.count()
        if src_total == 0:
            continue
        src_interviews = src_apps.filter(
            status__in=(
                Application.Status.TECHNICAL_INTERVIEW,
                Application.Status.HR_INTERVIEW,
                Application.Status.FINAL_INTERVIEW,
                Application.Status.OFFER,
                Application.Status.ACCEPTED,
            )
        ).count()
        src_offers = src_apps.filter(
            status__in=(Application.Status.OFFER, Application.Status.ACCEPTED)
        ).count()
        src_conv_rate = round((src_interviews / src_total * 100), 1) if src_total > 0 else 0.0

        source_stats.append({
            "source": src,
            "total_applications": src_total,
            "interviews": src_interviews,
            "offers": src_offers,
            "conversion_rate_pct": src_conv_rate,
        })
    source_stats.sort(key=lambda s: s["conversion_rate_pct"], reverse=True)

    # 4. Salary / Compensation Analysis
    salary_min_avg = apps_qs.filter(job__salary_min__isnull=False).aggregate(avg=Avg("job__salary_min"))["avg"] or 0
    salary_max_avg = apps_qs.filter(job__salary_max__isnull=False).aggregate(avg=Avg("job__salary_max"))["avg"] or 0

    mode_counts = {
        "remote": apps_qs.filter(job__work_mode="remote").count(),
        "hybrid": apps_qs.filter(job__work_mode="hybrid").count(),
        "onsite": apps_qs.filter(job__work_mode="onsite").count(),
    }

    # 5. Weekly Activity (Last 8 Weeks)
    weekly_activity = []
    start_of_current_week = now - timedelta(days=now.weekday())
    for w in range(7, -1, -1):
        week_start = start_of_current_week - timedelta(weeks=w)
        week_end = week_start + timedelta(days=6)
        week_apps_count = apps_qs.filter(
            Q(applied_date__gte=week_start, applied_date__lte=week_end) |
            Q(applied_date__isnull=True, created_at__date__gte=week_start, created_at__date__lte=week_end)
        ).count()
        weekly_activity.append({
            "week_label": f"{week_start.strftime('%b %d')}",
            "count": week_apps_count,
        })

    return {
        "timeframe": timeframe,
        "summary": {
            "total_tracked": total_tracked,
            "applied_count": applied_count,
            "wishlist_count": wishlist_count,
            "screening_count": screening_count,
            "interview_count": interview_count,
            "offer_count": offer_count,
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "withdrawn_count": withdrawn_count,
        },
        "rates": {
            "interview_rate_pct": interview_rate_pct,
            "offer_rate_pct": offer_rate_pct,
            "interview_to_offer_pct": interview_to_offer_pct,
            "avg_response_days": avg_response_days,
        },
        "funnel": [
            {"stage": "Applied", "count": applied_count, "pct": 100.0},
            {"stage": "Screening", "count": screening_count, "pct": round(screening_count / applied_count * 100, 1) if applied_count > 0 else 0.0},
            {"stage": "Interview", "count": interview_count, "pct": interview_rate_pct},
            {"stage": "Offer", "count": offer_count, "pct": offer_rate_pct},
            {"stage": "Accepted", "count": accepted_count, "pct": round(accepted_count / applied_count * 100, 1) if applied_count > 0 else 0.0},
        ],
        "source_roi": source_stats,
        "compensation": {
            "avg_salary_min": round(salary_min_avg, 2),
            "avg_salary_max": round(salary_max_avg, 2),
            "work_mode_distribution": mode_counts,
        },
        "weekly_activity": weekly_activity,
    }
