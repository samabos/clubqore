# Billing & Payment System Architecture

This document explains how billing, subscriptions, invoicing, and payments work together in ClubQore.

## Overview

| Module | Purpose | Who Uses It |
|--------|---------|-------------|
| **Membership Tiers** | Define pricing plans | Club managers |
| **Teams** | Groups with assigned tiers | Club managers |
| **Subscriptions** | Recurring billing for members | System (automatic) |
| **Invoices** | Payment documents | System + Club managers |
| **Payments** | GoCardless Direct Debit collection | System (automatic) |

---

## Data Flow Diagram

```
┌─────────────────────┐
│  Membership Tier    │  Club manager creates pricing
│  (e.g., £30/month)  │
└──────────┬──────────┘
           │ assigned to
           ▼
┌─────────────────────┐
│       Team          │  Each team has ONE tier
│   (e.g., U12A)      │  (team.membership_tier_id)
└──────────┬──────────┘
           │ child assigned to team (by admin)
           ▼
┌─────────────────────┐
│    Subscription     │  AUTOMATICALLY created
│    (for child)      │  Status: active
└──────────┬──────────┘
           │ on billing date (SYSTEM)
           ▼
┌─────────────────────┐
│      Invoice        │  Generated automatically
│   (INV-2026-0001)   │  Status: pending
└──────────┬──────────┘
           │ payment collected (SYSTEM)
           ▼
┌─────────────────────┐
│      Payment        │  Via GoCardless Direct Debit
│   (provider_payments)│  Status: paid_out
└─────────────────────┘
```

---

## Step-by-Step Flow

### 1. Setup Phase (Club Manager)

| Step | Action | Location |
|------|--------|----------|
| 1a | Create membership tiers | [MembershipTierService.js](../backend/src/payment/services/MembershipTierService.js) |
| 1b | Create teams | [TeamService.js](../backend/src/team/services/TeamService.js) |
| 1c | Assign tier to each team | `TeamService.setTeamTier()` |

### 2. Member Assignment (Club Manager)

| Step | Action | Location |
|------|--------|----------|
| 2a | Assign child to team | [TeamService.js:293-369](../backend/src/team/services/TeamService.js#L293) |
| 2b | **AUTOMATIC**: Subscription created | [TeamService.js:372-453](../backend/src/team/services/TeamService.js#L372) |

**Key validation**: Team must have a tier assigned before children can be added.

### 3. Payment Setup (Parent)

| Step | Action | Location |
|------|--------|----------|
| 3a | Parent initiates Direct Debit setup | [PaymentMandateService.js](../backend/src/payment/services/PaymentMandateService.js) |
| 3b | Redirected to GoCardless | External |
| 3c | Mandate created on completion | Webhook: `mandate.active` |

### 4. Billing Cycle (System - Automatic)

| Step | Action | Location |
|------|--------|----------|
| 4a | Worker checks due subscriptions | [subscription-billing-worker.js](../backend/src/workers/subscription-billing-worker.js) |
| 4b | Generate invoice | [SubscriptionBillingService.js:27](../backend/src/payment/services/SubscriptionBillingService.js#L27) |
| 4c | Collect payment via GoCardless | [SubscriptionBillingService.js:85](../backend/src/payment/services/SubscriptionBillingService.js#L85) |
| 4d | Update next billing date | [SubscriptionBillingService.js:162](../backend/src/payment/services/SubscriptionBillingService.js#L162) |

### 5. Payment Processing (System - Webhook)

| Step | Action | Location |
|------|--------|----------|
| 5a | GoCardless sends webhook | `/webhooks/gocardless` |
| 5b | Process payment event | [WebhookProcessorService.js](../backend/src/payment/services/WebhookProcessorService.js) |
| 5c | Mark invoice as paid | [SubscriptionBillingService.js:240](../backend/src/payment/services/SubscriptionBillingService.js#L240) |

---

## Scheduled Workers (System)

All workers are started in [server.js:246-256](../backend/src/server.js#L246).

| Worker | Schedule | Purpose | File |
|--------|----------|---------|------|
| **Invoice Scheduler** | 6:00 AM daily | Generate seasonal invoices | [invoice-scheduler.js](../backend/src/workers/invoice-scheduler.js) |
| **Subscription Billing** | 6:00 AM daily | Process due subscriptions | [subscription-billing-worker.js](../backend/src/workers/subscription-billing-worker.js) |
| **Payment Retry** | Every 4 hours | Retry failed payments | [payment-retry-worker.js](../backend/src/workers/payment-retry-worker.js) |
| **Notifications** | 9:00 AM daily | Send billing reminders | [subscription-notification-worker.js](../backend/src/workers/subscription-notification-worker.js) |

### Payment Retry Logic

Failed payments are retried on days 3, 5, and 7 after failure:

```
Payment Failed → Day 3: Retry 1 → Day 5: Retry 2 → Day 7: Retry 3 → Suspend Subscription
```

Configuration (`.env`):
```
BILLING_RETRY_MAX_ATTEMPTS=3
BILLING_RETRY_DAYS=3,5,7
BILLING_REMINDER_DAYS_BEFORE=3
```

---

## Status Transitions

### Subscription Status

```
pending ──────► active ──────► paused ──────► active
    │              │              │
    │              │              └──► cancelled (terminal)
    │              │
    │              └──► suspended (3+ payment failures)
    │                       │
    │                       └──► active (on payment recovery)
    │                       └──► cancelled (terminal)
    │
    └──► cancelled (terminal)
```

### Invoice Status

```
draft ──────► pending ──────► paid ✓
   │              │
   │              └──► overdue (past due_date)
   │              │
   └──► cancelled └──► cancelled
```

### Payment Mandate Status

```
pending_setup ──► submitted ──► active ✓
       │                           │
       └──► (error)               ├──► cancelled
                                   ├──► failed
                                   └──► expired
```

---

## Database Tables

### Core Tables

| Table | Purpose |
|-------|---------|
| `membership_tiers` | Pricing plans per club |
| `teams` | Teams with `membership_tier_id` |
| `subscriptions` | Active subscriptions linking child → tier → team |
| `invoices` | Invoice documents |
| `invoice_items` | Line items per invoice |

### Payment Tables

| Table | Purpose |
|-------|---------|
| `payment_customers` | Links users to GoCardless customer IDs |
| `payment_mandates` | Direct Debit authorizations |
| `payment_methods` | User payment methods |
| `provider_payments` | Payment records with GoCardless IDs |
| `subscription_events` | Audit log of subscription changes |

---

## Key Constraints

1. **Team must have tier**: Cannot assign child to team without `membership_tier_id`
2. **One subscription per child per club**: Database unique constraint
3. **Team change = tier change**: Moving teams cancels old subscription, creates new one
4. **Billing day max 28**: Handles months with different lengths

---

## API Endpoints

### Club Manager (Billing)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/billing/invoices` | List club invoices |
| POST | `/billing/invoices` | Create invoice |
| PUT | `/billing/invoices/:id/publish` | Publish draft invoice |
| PUT | `/billing/invoices/:id/mark-paid` | Mark as paid |
| GET | `/billing/settings` | Get billing config |

### Club Manager (Subscriptions)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/club/membership-tiers` | List tiers |
| POST | `/club/membership-tiers` | Create tier |
| PUT | `/teams/:id/tier` | Assign tier to team |
| GET | `/club/subscriptions` | List all subscriptions |

### Parent

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/parent/subscriptions` | View subscriptions |
| PUT | `/parent/subscriptions/:id/pause` | Pause subscription |
| PUT | `/parent/subscriptions/:id/resume` | Resume subscription |
| DELETE | `/parent/subscriptions/:id` | Cancel subscription |
| POST | `/parent/payment-methods/mandate/setup` | Start Direct Debit setup |
| GET | `/parent/invoices` | View invoices |

### Webhooks (No Auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/webhooks/gocardless` | GoCardless events |

---

## Frontend Modules

| Module | Path | Purpose |
|--------|------|---------|
| Billing | `/frontend/src/modules/billing/` | Club invoice management |
| Subscription | `/frontend/src/modules/subscription/` | Tier & subscription management |
| Parent Billing | `/frontend/src/modules/parent-billing/` | Parent view of invoices & payments |

---

## Manual vs Automatic Invoices

| Type | Created By | Use Case |
|------|------------|----------|
| **Subscription Invoice** | System (automatic) | Monthly/annual membership fees |
| **Seasonal Invoice** | System (scheduled) | Season-based bulk invoicing |
| **Manual Invoice** | Club manager | One-off charges, equipment, etc. |

Club managers can still create manual invoices for one-off charges (equipment, events, etc.) using the Billing module, independent of subscriptions.
