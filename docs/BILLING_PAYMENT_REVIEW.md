# Billing, Subscription & Payment System Review

## Executive Summary

This document reviews the billing, subscription, and payment implementation in ClubQore and provides recommendations based on industry best practices.

---

## Current Architecture Overview

### Payment Provider
- **Primary Provider**: GoCardless (Direct Debit - BACS/SEPA)
- **Architecture Pattern**: Provider-agnostic factory pattern via `PaymentProviderInterface`
- **Future Ready**: Stripe integration is prepared but not implemented

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| GoCardlessProvider | `backend/src/payment/providers/GoCardlessProvider.js` | GoCardless API integration |
| PaymentProviderFactory | `backend/src/payment/services/PaymentProviderFactory.js` | Provider abstraction |
| PaymentMandateService | `backend/src/payment/services/PaymentMandateService.js` | Mandate lifecycle |
| SubscriptionBillingService | `backend/src/payment/services/SubscriptionBillingService.js` | Billing cycles |
| SubscriptionService | `backend/src/payment/services/SubscriptionService.js` | Subscription lifecycle |
| WebhookProcessorService | `backend/src/payment/services/WebhookProcessorService.js` | Webhook handling |

### Database Schema
- `subscriptions` - Member subscriptions
- `membership_tiers` - Pricing tiers
- `payment_mandates` - Direct Debit authorizations
- `payment_customers` - Provider customer mappings
- `provider_payments` - Payment records
- `payment_webhooks` - Webhook audit log

---

## Issues Identified (Payment Not Working)

### 1. **CRITICAL: Missing Environment Variables**

The payment system requires several environment variables that may not be configured:

```bash
# Required for payments to work
GOCARDLESS_ACCESS_TOKEN=        # GoCardless API access token
GOCARDLESS_ENVIRONMENT=sandbox  # 'sandbox' or 'live'
GOCARDLESS_WEBHOOK_SECRET=      # Webhook signature verification

# Required for encryption (mandate setup flow)
PAYMENT_ENCRYPTION_KEY=         # 32-byte (64 char) hex string for AES-256
PAYMENT_HASH_SALT=              # Salt for hashing sensitive data

# Required for redirect URLs
FRONTEND_URL=http://localhost:3001
```

**Impact**: Without `GOCARDLESS_ACCESS_TOKEN`, the provider will fail to initialize.
**Location**: `backend/src/payment/providers/GoCardlessProvider.js:49-51`

### 2. **CRITICAL: Mandate Setup Redirect URL Issues**

The mandate setup flow builds redirect URLs using `config.app?.frontendUrl`:

```javascript
// PaymentMandateService.js:38-39
const baseUrl = config.app?.frontendUrl || 'http://localhost:3001';
```

The redirect URLs are:
- Success: `${baseUrl}/billing/mandate/complete?state=...`
- Cancel: `${baseUrl}/billing/mandate/cancel?state=...`

**Issues**:
1. These routes may not be configured in the frontend router
2. The `/billing/mandate/complete` endpoint expects to be called with authentication
3. GoCardless may not be able to redirect back properly if the URL is localhost in production

### 3. **CRITICAL: Webhook Endpoint Not Registered**

The webhook routes need to be properly mounted at `/api/webhooks`:

```javascript
// webhookRoutes.js expects to be mounted at /api/webhooks
// POST /api/webhooks/gocardless
```

**Verify**:
- Webhook routes are registered in the main app
- The endpoint is publicly accessible (webhooks don't require auth)
- The raw body is preserved for signature verification

### 4. **HIGH: Workers May Not Be Started**

Background workers are essential for billing:
- `subscription-billing-worker.js` - Runs daily at 6 AM
- `payment-retry-worker.js` - Runs every 4 hours

**These workers must be started when the application boots**.

### 5. **HIGH: Missing Idempotency Key in Payments**

In `GoCardlessProvider.js:327-331`, the idempotency key is prepared but never sent:

```javascript
const headers = {};
if (paymentData.idempotencyKey) {
  headers['Idempotency-Key'] = paymentData.idempotencyKey;
}
// But headers are never passed to _request!
const response = await this._request('POST', '/payments', payload);
```

**Impact**: Duplicate payments could occur on network retries.

### 6. **MEDIUM: Invoice Type Mismatch**

`SubscriptionBillingService.js:43` uses `invoice_type: 'subscription'`, but the migration only defines: `draft`, `pending`, `paid`, `overdue`, `cancelled`.

### 7. **MEDIUM: Subscription Not Linked to Mandate During Creation**

When a subscription is created without a mandate (`paymentMandateId = null`), it stays in `pending` status. The flow to link a mandate after creation may be unclear to users.

### 8. **LOW: Missing Notification Integration**

`WebhookProcessorService.js:338-346` has TODO for email notifications:

```javascript
async _sendPaymentNotification(templateKey, data) {
  // This would integrate with the email service
  // For now, just log it
  console.log(`Would send notification: ${templateKey}`, data);
  // TODO: Integrate with emailService.sendEmail()
}
```

---

## Best Practice Recommendations

### 1. **Environment Configuration**

Create a `.env.example` file with all required variables:

```bash
# Payment Provider - GoCardless
GOCARDLESS_ACCESS_TOKEN=your_access_token_here
GOCARDLESS_ENVIRONMENT=sandbox
GOCARDLESS_WEBHOOK_SECRET=your_webhook_secret_here

# Payment Security
PAYMENT_ENCRYPTION_KEY=your_64_char_hex_string_here
PAYMENT_HASH_SALT=your_random_salt_here

# Application URLs
FRONTEND_URL=https://your-app.com
BACKEND_URL=https://api.your-app.com
```

Add validation in config:

```javascript
export const validatePaymentConfig = () => {
  const required = [
    'GOCARDLESS_ACCESS_TOKEN',
    'GOCARDLESS_WEBHOOK_SECRET',
    'PAYMENT_ENCRYPTION_KEY'
  ];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing payment config:', missing);
    return false;
  }
  return true;
};
```

### 2. **Fix Idempotency Key Issue**

Update `GoCardlessProvider._request()` to accept headers:

```javascript
async _request(method, path, data = null, additionalHeaders = {}) {
  const headers = {
    'Authorization': `Bearer ${this.accessToken}`,
    'GoCardless-Version': '2015-07-06',
    'Content-Type': 'application/json',
    ...additionalHeaders  // Merge additional headers
  };
  // ...
}
```

### 3. **Implement Webhook Verification Monitoring**

Add webhook health monitoring:

```javascript
// Track webhook processing success rate
async getWebhookStats(hoursBack = 24) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  return this.db('payment_webhooks')
    .where('created_at', '>=', since)
    .select(
      this.db.raw('COUNT(*) as total'),
      this.db.raw('COUNT(*) FILTER (WHERE signature_valid = true) as valid'),
      this.db.raw('COUNT(*) FILTER (WHERE processed = true) as processed'),
      this.db.raw('COUNT(*) FILTER (WHERE error_message IS NOT NULL) as errors')
    )
    .first();
}
```

### 4. **Add Payment Flow State Machine**

Implement explicit state transitions for better debugging:

```javascript
const PAYMENT_FLOW_STATES = {
  'MANDATE_SETUP_INITIATED': ['MANDATE_SETUP_COMPLETED', 'MANDATE_SETUP_FAILED'],
  'MANDATE_SETUP_COMPLETED': ['SUBSCRIPTION_CREATED'],
  'SUBSCRIPTION_CREATED': ['PAYMENT_INITIATED'],
  'PAYMENT_INITIATED': ['PAYMENT_CONFIRMED', 'PAYMENT_FAILED'],
  'PAYMENT_CONFIRMED': ['PAYMENT_PAID_OUT'],
  'PAYMENT_FAILED': ['PAYMENT_RETRY_INITIATED', 'SUBSCRIPTION_SUSPENDED']
};
```

### 5. **Add Comprehensive Logging**

Add structured logging for payment debugging:

```javascript
logger.info({
  event: 'payment_initiated',
  subscriptionId,
  mandateId,
  amount,
  provider: 'gocardless',
  timestamp: new Date().toISOString()
});
```

### 6. **Implement Health Check Endpoint**

```javascript
// GET /api/payment/health
async healthCheck() {
  const checks = {
    provider: await this.checkProviderConnection(),
    webhooks: await this.checkWebhookStats(),
    workers: await this.checkWorkerStatus(),
    pendingPayments: await this.countPendingPayments()
  };
  return {
    status: Object.values(checks).every(c => c.healthy) ? 'healthy' : 'degraded',
    checks
  };
}
```

### 7. **Add Retry Mechanism for Provider API Calls**

Implement exponential backoff for transient failures:

```javascript
async _requestWithRetry(method, path, data = null, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await this._request(method, path, data);
    } catch (error) {
      if (error.status >= 500 || error.code === 'ECONNRESET') {
        lastError = error;
        await this._sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
```

### 8. **Implement Circuit Breaker Pattern**

Prevent cascading failures when GoCardless is down:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is open');
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### 9. **Add Database Transaction Boundaries**

Ensure atomic operations in billing:

```javascript
async processBillingCycle(subscriptionId) {
  return await this.db.transaction(async (trx) => {
    // All operations within transaction
    const invoice = await this.createInvoice(trx, subscriptionId);
    const payment = await this.initiatePayment(trx, invoice);
    await this.updateBillingDates(trx, subscriptionId);
    return { invoice, payment };
  });
}
```

### 10. **Implement Audit Trail**

Add comprehensive audit logging:

```javascript
async logPaymentEvent(eventType, data) {
  await this.db('payment_audit_log').insert({
    event_type: eventType,
    subscription_id: data.subscriptionId,
    payment_id: data.paymentId,
    mandate_id: data.mandateId,
    amount: data.amount,
    status: data.status,
    provider: data.provider,
    error_message: data.error,
    metadata: JSON.stringify(data.metadata),
    created_at: new Date()
  });
}
```

---

## Immediate Action Items

### Priority 1 (Critical - Payments Won't Work Without These)

1. [ ] Configure all required environment variables
2. [ ] Verify GoCardless sandbox credentials are valid
3. [ ] Ensure webhook endpoint is publicly accessible
4. [ ] Configure frontend redirect routes for mandate completion
5. [ ] Start background workers on application boot

### Priority 2 (High - Production Readiness)

6. [ ] Fix idempotency key header not being sent
7. [ ] Add payment configuration validation on startup
8. [ ] Implement webhook signature verification monitoring
9. [ ] Add payment flow health check endpoint

### Priority 3 (Medium - Best Practices)

10. [ ] Implement structured logging
11. [ ] Add API retry mechanism with exponential backoff
12. [ ] Integrate email notifications for payment events
13. [ ] Add circuit breaker for provider API calls

---

## Testing Checklist

### Manual Testing Flow

1. **Mandate Setup**
   - [ ] Create payment method -> Get redirect URL
   - [ ] Complete GoCardless hosted flow
   - [ ] Verify callback is received
   - [ ] Verify mandate is created in database

2. **Subscription Creation**
   - [ ] Create subscription for child
   - [ ] Verify subscription links to mandate
   - [ ] Verify status transitions work

3. **Payment Collection**
   - [ ] Trigger billing worker manually
   - [ ] Verify invoice is created
   - [ ] Verify payment is submitted to GoCardless
   - [ ] Verify webhook updates payment status

4. **Payment Failure Handling**
   - [ ] Simulate payment failure via sandbox
   - [ ] Verify retry worker picks up failed payment
   - [ ] Verify subscription suspension after max retries

### Webhook Testing

Use the GoCardless sandbox webhook tool to simulate:
- `mandate.active`
- `payment.paid_out`
- `payment.failed`
- `mandate.cancelled`

---

## Architecture Strengths

1. **Provider Abstraction**: Well-designed factory pattern allows easy addition of new providers
2. **Webhook Idempotency**: Duplicate event processing is prevented
3. **Encryption**: AES-256-GCM for sensitive data with version support for key rotation
4. **Audit Trail**: Subscription events are logged for compliance
5. **Status State Machine**: Clear subscription status transitions with validation

---

## Conclusion

The billing and payment architecture is well-designed with proper abstractions. The primary issues preventing payments from working are likely:

1. **Missing environment configuration**
2. **Webhook endpoint not accessible**
3. **Background workers not running**
4. **Frontend redirect routes not configured**

Address the Priority 1 items first to enable basic payment functionality, then work through Priority 2 and 3 for production readiness.
