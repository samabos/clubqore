/**
 * Webhook Processor Service
 *
 * Processes webhooks from payment providers (GoCardless, Stripe, etc.)
 * Handles mandate and payment status updates.
 */

import { verifyWebhookSignature, parseWebhookEvents, getSignatureHeaderName } from '../utils/webhookValidator.js';
import { encrypt } from '../utils/encryption.js';
import { PaymentMandateService } from './PaymentMandateService.js';
import { SubscriptionBillingService } from './SubscriptionBillingService.js';
import { SubscriptionService } from './SubscriptionService.js';

export class WebhookProcessorService {
  constructor(db) {
    this.db = db;
    this.mandateService = new PaymentMandateService(db);
    this.billingService = new SubscriptionBillingService(db);
    this.subscriptionService = new SubscriptionService(db);
  }

  /**
   * Process an incoming webhook
   *
   * @param {string} provider - Payment provider name
   * @param {string} rawBody - Raw request body (string)
   * @param {string} signature - Signature header value
   * @returns {Promise<Object>} Processing result
   */
  async processWebhook(provider, rawBody, signature) {
    // Verify signature first
    const isValid = verifyWebhookSignature(provider, rawBody, signature);

    // Parse the payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      throw new Error('Invalid JSON payload');
    }

    // Log the webhook
    const webhookId = await this._logWebhook(provider, payload, isValid);

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Parse events from payload
    const events = parseWebhookEvents(provider, payload);
    const results = [];

    // Process each event
    for (const event of events) {
      try {
        const result = await this._processEvent(provider, event);
        results.push({ eventId: event.id, success: true, result });
      } catch (error) {
        results.push({ eventId: event.id, success: false, error: error.message });
        console.error(`Error processing webhook event ${event.id}:`, error);
      }
    }

    // Mark webhook as processed
    await this._markWebhookProcessed(webhookId, results);

    return {
      webhookId,
      eventsProcessed: results.length,
      results
    };
  }

  /**
   * Process a single webhook event
   *
   * @private
   * @param {string} provider - Provider name
   * @param {Object} event - Normalized event object
   * @returns {Promise<Object>} Processing result
   */
  async _processEvent(provider, event) {
    const { resourceType, action, resourceId } = event;

    // Check for duplicate processing (idempotency)
    const existingEvent = await this.db('payment_webhooks')
      .where({ provider, event_id: event.id, processed: true })
      .first();

    if (existingEvent) {
      return { skipped: true, reason: 'Already processed' };
    }

    // Route to appropriate handler
    switch (resourceType) {
      case 'mandates':
        return this._handleMandateEvent(provider, event);

      case 'payments':
        return this._handlePaymentEvent(provider, event);

      case 'refunds':
        return this._handleRefundEvent(provider, event);

      default:
        console.log(`Unhandled webhook resource type: ${resourceType}`);
        return { handled: false, resourceType };
    }
  }

  /**
   * Handle mandate-related events
   *
   * @private
   */
  async _handleMandateEvent(provider, event) {
    const { action, resourceId, details } = event;

    switch (action) {
      case 'created':
        // Mandate created - usually handled in setup flow
        return { action: 'mandate_created', mandateId: resourceId };

      case 'active':
      case 'submitted':
        // Mandate is active - update local status
        await this.mandateService.updateMandateStatus(provider, resourceId, action, {
          reference: details.reference,
          nextPossibleChargeDate: details.next_possible_charge_date
        });

        // Activate any pending subscriptions using this mandate
        await this._activatePendingSubscriptions(resourceId);

        return { action: `mandate_${action}`, mandateId: resourceId };

      case 'cancelled':
      case 'failed':
      case 'expired':
        // Mandate no longer valid
        await this.mandateService.updateMandateStatus(provider, resourceId, action);

        // Suspend subscriptions using this mandate
        await this._suspendSubscriptionsForMandate(resourceId);

        return { action: `mandate_${action}`, mandateId: resourceId };

      default:
        return { action: `mandate_${action}`, handled: false };
    }
  }

  /**
   * Handle payment-related events
   *
   * @private
   */
  async _handlePaymentEvent(provider, event) {
    const { action, resourceId, details } = event;

    switch (action) {
      case 'created':
      case 'submitted':
        // Payment created/submitted - update status
        await this._updatePaymentStatus(provider, resourceId, action);
        return { action: `payment_${action}`, paymentId: resourceId };

      case 'confirmed':
        // Payment confirmed but not yet paid out
        await this._updatePaymentStatus(provider, resourceId, 'confirmed');
        return { action: 'payment_confirmed', paymentId: resourceId };

      case 'paid_out':
        // Payment successfully collected - mark as complete
        const successResult = await this.billingService.handlePaymentSuccess(provider, resourceId);

        // Send success notification
        await this._sendPaymentNotification('payment_successful', successResult);

        return { action: 'payment_paid_out', paymentId: resourceId, ...successResult };

      case 'failed':
      case 'cancelled':
      case 'customer_approval_denied':
        // Payment failed
        const failReason = details.cause || details.description || action;
        const failResult = await this.billingService.handlePaymentFailure(provider, resourceId, failReason);

        // Send failure notification
        await this._sendPaymentNotification('payment_failed', failResult);

        // Send suspension notification if applicable
        if (failResult.subscriptionSuspended) {
          await this._sendPaymentNotification('membership_suspended', failResult);
        }

        return { action: `payment_${action}`, paymentId: resourceId, ...failResult };

      case 'charged_back':
        // Chargeback - record and potentially suspend
        await this._handleChargeback(provider, resourceId);
        return { action: 'payment_charged_back', paymentId: resourceId };

      default:
        return { action: `payment_${action}`, handled: false };
    }
  }

  /**
   * Handle refund-related events
   *
   * @private
   */
  async _handleRefundEvent(provider, event) {
    const { action, resourceId, details } = event;

    // Log refund events for now
    console.log(`Refund event: ${action} for ${resourceId}`);

    return { action: `refund_${action}`, refundId: resourceId };
  }

  /**
   * Activate pending subscriptions for a mandate
   *
   * @private
   */
  async _activatePendingSubscriptions(providerMandateId) {
    // Get the local mandate
    const mandate = await this.db('payment_mandates')
      .where({ provider_mandate_id: providerMandateId })
      .first();

    if (!mandate) return;

    // Get pending subscriptions
    const pendingSubscriptions = await this.db('subscriptions')
      .where({ payment_mandate_id: mandate.id, status: 'pending' });

    for (const subscription of pendingSubscriptions) {
      try {
        await this.subscriptionService.activateSubscription(
          subscription.id,
          mandate.id,
          { actorType: 'webhook' }
        );
      } catch (error) {
        console.error(`Error activating subscription ${subscription.id}:`, error);
      }
    }
  }

  /**
   * Suspend subscriptions when mandate is no longer valid
   *
   * @private
   */
  async _suspendSubscriptionsForMandate(providerMandateId) {
    const mandate = await this.db('payment_mandates')
      .where({ provider_mandate_id: providerMandateId })
      .first();

    if (!mandate) return;

    const activeSubscriptions = await this.db('subscriptions')
      .where({ payment_mandate_id: mandate.id })
      .whereIn('status', ['active', 'paused']);

    for (const subscription of activeSubscriptions) {
      try {
        await this.subscriptionService.suspendSubscription(
          subscription.id,
          { actorType: 'webhook' }
        );
      } catch (error) {
        console.error(`Error suspending subscription ${subscription.id}:`, error);
      }
    }
  }

  /**
   * Update payment status from webhook
   *
   * @private
   */
  async _updatePaymentStatus(provider, providerPaymentId, status) {
    await this.db('provider_payments')
      .where({ provider, provider_payment_id: providerPaymentId })
      .update({
        status,
        updated_at: new Date()
      });
  }

  /**
   * Handle chargeback event
   *
   * @private
   */
  async _handleChargeback(provider, providerPaymentId) {
    const payment = await this.db('provider_payments')
      .where({ provider, provider_payment_id: providerPaymentId })
      .first();

    if (!payment) return;

    // Update payment status
    await this.db('provider_payments')
      .where({ id: payment.id })
      .update({
        status: 'charged_back',
        updated_at: new Date()
      });

    // Reverse invoice payment if applicable
    if (payment.invoice_id) {
      await this.db('invoices')
        .where({ id: payment.invoice_id })
        .update({
          status: 'overdue',
          amount_paid: 0,
          paid_date: null,
          updated_at: new Date()
        });
    }

    // Record failed payment on subscription
    if (payment.subscription_id) {
      await this.subscriptionService.recordFailedPayment(payment.subscription_id);
    }
  }

  /**
   * Send payment-related notifications
   *
   * @private
   */
  async _sendPaymentNotification(templateKey, data) {
    // This would integrate with the email service
    // For now, just log it
    console.log(`Would send notification: ${templateKey}`, data);

    // TODO: Integrate with emailService.sendEmail()
    // const { subscriptionId, invoiceId } = data;
    // await emailService.sendSubscriptionNotification(templateKey, subscriptionId, invoiceId);
  }

  /**
   * Log webhook to database
   *
   * @private
   */
  async _logWebhook(provider, payload, signatureValid) {
    const events = parseWebhookEvents(provider, payload);
    const firstEvent = events[0] || {};

    const [webhook] = await this.db('payment_webhooks')
      .insert({
        provider,
        event_id: firstEvent.id || `unknown_${Date.now()}`,
        resource_type: firstEvent.resourceType || 'unknown',
        action: firstEvent.action || 'unknown',
        resource_id: firstEvent.resourceId,
        payload: encrypt(JSON.stringify(payload)),
        signature_valid: signatureValid,
        processed: false,
        created_at: new Date()
      })
      .onConflict(['provider', 'event_id'])
      .ignore()
      .returning('id');

    return webhook?.id;
  }

  /**
   * Mark webhook as processed
   *
   * @private
   */
  async _markWebhookProcessed(webhookId, results) {
    if (!webhookId) return;

    const hasErrors = results.some(r => !r.success);

    await this.db('payment_webhooks')
      .where({ id: webhookId })
      .update({
        processed: true,
        processed_at: new Date(),
        error_message: hasErrors
          ? results.filter(r => !r.success).map(r => r.error).join('; ')
          : null
      });
  }
}

export default WebhookProcessorService;
