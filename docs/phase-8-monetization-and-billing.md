# Phase 8: Monetization, Plans & Subscription Entitlements

## Overview
Phase 8 introduces the **Monetization & Entitlement Engine**, offering candidates a choice between the **Free Starter Plan** and the **Pro Career Intelligence Plan** ($12/month or $99/year).

---

## 1. Plan Comparison & Entitlements

| Feature | Free Starter Tier ($0/mo) | Pro Career Intelligence ($12/mo or $99/yr) |
|---|---|---|
| Active Tracked Applications | Up to 15 roles | **Unlimited** |
| AI ATS Keyword Scans | 5 scans / month | **Unlimited** |
| Tailored AI Cover Letters | 5 drafts / month | **Unlimited** |
| Resume Storage & Versions | 1 Master Resume | **Unlimited** |
| Conversion Funnel & ROI Analytics | Basic summary | **Advanced Funnel & Source ROI** |
| AI Mock Interview Coach | Basic preview | **Full STAR Blueprint Coach** |
| Data Portability & Backup | Not included | **Full CSV & JSON Exports** |
| Support Level | Standard Email | **Priority 24/7 Candidate Support** |

---

## 2. Domain Models (`backend/apps/billing/models.py`)

### Subscription (`Subscription`)
* `id`: UUID primary key
* `user`: OneToOneField(User, related_name='subscription', on_delete=CASCADE)
* `plan`: Choices (`free`, `pro_monthly`, `pro_yearly`)
* `status`: Choices (`active`, `past_due`, `canceled`, `trialing`)
* `ai_scans_used_this_month`: PositiveIntegerField(default=0)
* `cover_letters_used_this_month`: PositiveIntegerField(default=0)
* `current_period_end`: DateTimeField(null=True, blank=True)
* `stripe_customer_id`, `stripe_subscription_id`: CharField(blank=True)
* Methods: `is_pro`, `can_add_application(count)`, `can_run_ai_scan()`, `can_generate_cover_letter()`, `upgrade_to_pro(yearly)`, `cancel_subscription()`.

---

## 3. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/billing/subscription/` | Returns plan, status, quota usage meters, and remaining limits |
| `POST` | `/api/v1/billing/upgrade/` | Upgrades account to Pro plan with instant entitlement activation |
| `POST` | `/api/v1/billing/cancel/` | Cancels Pro plan and reverts to Free Starter tier |

---

## 4. Frontend Billing Hub (`frontend/src/app/billing/page.tsx`)

* **Active Quota Meters**: Visual progress bars showing consumption of applications, AI scans, and cover letters.
* **Billing Period Toggle**: Monthly vs. Annual toggle with **Save 30%** badge.
* **Side-by-Side Pricing Cards**: High-converting feature comparison with **"MOST POPULAR"** highlight.
* **1-Click Pro Upgrade Action**: Immediate upgrade simulation with celebratory confetti.
