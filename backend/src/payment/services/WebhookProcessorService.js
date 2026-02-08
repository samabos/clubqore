/**
 * Webhook Processor Service
 *
 * Processes webhooks from payment providers (GoCardless, Stripe, etc.)
 * Handles mandate and payment status updates.
 */

import { verifyWebhookSignature, parseWebhookEvents } from '../utils/webhookValidator.js';
import { PaymentMandateService } from './PaymentMandateService.js';
import { SubscriptionBillingService } from './SubscriptionBillingService.js';
import { SubscriptionService } from './SubscriptionService.js';
import { InvoiceService } from '../../billing/services/InvoiceService.js';
import { EmailOutboxService } from '../../shared/services/emailOutboxService.js';
import { emailService } from '../../shared/services/emailService.js';
import { getConfig } from '../../config/index.js';

export class WebhookProcessorService {
  constructor(db) {
    this.db = db;
    this.mandateService = new PaymentMandateService(db);
    this.billingService = new SubscriptionBillingService(db);
    this.subscriptionService = new SubscriptionService(db);
    this.invoiceService = new InvoiceService(db);
    this.emailOutbox = new EmailOutboxService(db, emailService);
  }

  /**
   * Process an incoming webhook
   *
   * Uses a transaction to ensure webhook is only logged if processing succeeds.
   *
   * @param {string} provider - Payment provider name
   * @param {string} rawBody - Raw request body (string)
   * @param {string} signature - Signature header value
   * @returns {Promise<Object>} Processing result
   */
  async processWebhook(provider, rawBody, signature) {
    // Verify signature first (before transaction)
    const isValid = verifyWebhookSignature(provider, rawBody, signature);

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Parse the payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new Error('Invalid JSON payload');
    }

    // Parse events from payload
    const events = parseWebhookEvents(provider, payload);

    // Use transaction to ensure atomicity
    return await this.db.transaction(async (trx) => {
      // Log the webhook within transaction
      const webhookId = await this._logWebhook(trx, provider, payload, isValid);

      const results = [];

      // Process each event
      for (const event of events) {
        try {
          const result = await this._processEvent(trx, provider, event);
          results.push({ eventId: event.id, success: true, result });
        } catch (error) {
          results.push({ eventId: event.id, success: false, error: error.message });
          console.error(`Error processing webhook event ${event.id}:`, error);
          // Re-throw to rollback transaction on failure
          throw error;
        }
      }

      // Mark webhook as processed within transaction
      await this._markWebhookProcessed(trx, webhookId, results);

      return {
        webhookId,
        eventsProcessed: results.length,
        results
      };
    });
  }

  /**
   * Process a single webhook event
   *
   * @private
   * @param {Object} trx - Knex transaction
   * @param {string} provider - Provider name
   * @param {Object} event - Normalized event object
   * @returns {Promise<Object>} Processing result
   */
  async _processEvent(trx, provider, event) {
    const { resourceType } = event;

    // Check for duplicate processing (idempotency)
    const existingEvent = await trx('payment_webhooks')
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

      case 'subscriptions':
        return this._handleSubscriptionEvent(provider, event);

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
    const { action, resourceId, details, raw } = event;

    switch (action) {
      case 'created': {
        // Payment created by GoCardless subscription - create invoice
        const invoiceResult = await this._createInvoiceForPayment(provider, resourceId, raw);
        return { action: 'payment_created', paymentId: resourceId, ...invoiceResult };
      }

      case 'submitted':
        // Payment submitted - update status
        await this._updatePaymentStatus(provider, resourceId, action);
        return { action: 'payment_submitted', paymentId: resourceId };

      case 'confirmed':
        // Payment confirmed but not yet paid out
        await this._updatePaymentStatus(provider, resourceId, 'confirmed');
        return { action: 'payment_confirmed', paymentId: resourceId };

      case 'paid_out': {
        // Payment successfully collected - mark as complete
        const successResult = await this.billingService.handlePaymentSuccess(provider, resourceId);

        // Send success notification
        await this._sendPaymentNotification('payment_successful', successResult);

        return { action: 'payment_paid_out', paymentId: resourceId, ...successResult };
      }

      case 'failed':
      case 'cancelled':
      case 'customer_approval_denied': {
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
      }

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
  async _handleRefundEvent(_provider, event) {
    const { action, resourceId } = event;

    // Log refund events for now
    console.log(`Refund event: ${action} for ${resourceId}`);

    return { action: `refund_${action}`, refundId: resourceId };
  }

  /**
   * Handle GoCardless subscription events
   *
   * @private
   */
  async _handleSubscriptionEvent(provider, event) {
    const { action, resourceId } = event;

    switch (action) {
      case 'created':
        // GoCardless subscription created - confirm in our system
        console.log(`GC Subscription created: ${resourceId}`);
        return { action: 'subscription_created', providerSubscriptionId: resourceId };

      case 'payment_created':
        // GoCardless created a payment for a subscription
        // This is handled by _handlePaymentEvent with action: 'created'
        return { action: 'subscription_payment_created', providerSubscriptionId: resourceId };

      case 'cancelled': {
        // GoCardless subscription cancelled - update our record
        await this._syncSubscriptionStatus(provider, resourceId, 'cancelled');
        return { action: 'subscription_cancelled', providerSubscriptionId: resourceId };
      }

      case 'finished': {
        // GoCardless subscription finished (all payments complete)
        await this._syncSubscriptionStatus(provider, resourceId, 'finished');
        return { action: 'subscription_finished', providerSubscriptionId: resourceId };
      }

      case 'paused': {
        // GoCardless subscription paused
        await this._syncSubscriptionStatus(provider, resourceId, 'paused');
        return { action: 'subscription_paused', providerSubscriptionId: resourceId };
      }

      case 'resumed': {
        // GoCardless subscription resumed
        await this._syncSubscriptionStatus(provider, resourceId, 'active');
        return { action: 'subscription_resumed', providerSubscriptionId: resourceId };
      }

      default:
        console.log(`Unhandled subscription action: ${action}`);
        return { action: `subscription_${action}`, handled: false };
    }
  }

  /**
   * Sync subscription status from provider event
   *
   * @private
   */
  async _syncSubscriptionStatus(_provider, providerSubscriptionId, status) {
    // Find our subscription by provider subscription ID
    const subscription = await this.db('subscriptions')
      .where({ provider_subscription_id: providerSubscriptionId })
      .first();

    if (!subscription) {
      console.log(`No local subscription found for provider subscription: ${providerSubscriptionId}`);
      return;
    }

    // Update provider subscription status
    await this.db('subscriptions')
      .where({ id: subscription.id })
      .update({
        provider_subscription_status: status,
        updated_at: new Date()
      });

    // Also update our subscription status if needed
    if (status === 'cancelled' && subscription.status !== 'cancelled') {
      await this.subscriptionService.cancelSubscription(subscription.id, {
        actorType: 'webhook',
        reason: 'Cancelled via GoCardless'
      });
    } else if (status === 'paused' && subscription.status === 'active') {
      await this.subscriptionService.pauseSubscription(subscription.id, {
        actorType: 'webhook'
      });
    } else if (status === 'active' && subscription.status === 'paused') {
      await this.subscriptionService.resumeSubscription(subscription.id, {
        actorType: 'webhook'
      });
    }
  }

  /**
   * Create invoice when GoCardless creates a payment
   *
   * @private
   */
  async _createInvoiceForPayment(provider, providerPaymentId, rawEvent) {
    try {
      // Get subscription from payment metadata or links
      const metadata = rawEvent?.metadata || {};
      const subscriptionId = metadata.subscription_id;
      const providerSubscriptionId = rawEvent?.links?.subscription;

      // Find our subscription
      let subscription;
      if (subscriptionId) {
        subscription = await this.db('subscriptions')
          .where({ id: subscriptionId })
          .first();
      } else if (providerSubscriptionId) {
        subscription = await this.db('subscriptions')
          .where({ provider_subscription_id: providerSubscriptionId })
          .first();
      }

      if (!subscription) {
        console.log(`No subscription found for payment ${providerPaymentId}`);
        // Still record the payment even without subscription
        await this._recordProviderPayment(provider, providerPaymentId, rawEvent, null);
        return { invoiceCreated: false, reason: 'No subscription found' };
      }

      // Get subscription details with tier and child info
      const subscriptionDetails = await this.db('subscriptions as s')
        .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
        .join('users as child', 's.child_user_id', 'child.id')
        .leftJoin('user_profiles as child_profile', 's.child_user_id', 'child_profile.user_id')
        .where('s.id', subscription.id)
        .select(
          's.*',
          'mt.name as tier_name',
          this.db.raw(`COALESCE(child_profile.first_name, split_part(child.email, '@', 1)) as child_first_name`),
          this.db.raw(`COALESCE(child_profile.last_name, '') as child_last_name`)
        )
        .first();

      // Parse amount from raw event (GoCardless sends in pence)
      const amountInPence = rawEvent?.amount || subscription.amount * 100;
      const amount = amountInPence / 100;
      const chargeDate = rawEvent?.charge_date;

      // Create the invoice
      const childName = `${subscriptionDetails.child_first_name} ${subscriptionDetails.child_last_name}`.trim();
      const description = `${subscriptionDetails.tier_name} - ${childName}`;

      const invoiceResult = await this.invoiceService.createInvoice(
        subscription.club_id,
        {
          user_id: subscription.child_user_id,
          invoice_type: 'subscription',
          status: 'pending', // Will be updated when payment succeeds
          issue_date: new Date(),
          due_date: chargeDate ? new Date(chargeDate) : new Date(),
          items: [{
            description,
            quantity: 1,
            unit_price: amount
          }],
          notes: `Auto-generated for subscription payment`
        },
        subscription.parent_user_id // Use parent as creator for webhook-generated invoices
      );

      // Record the payment and link to invoice
      await this._recordProviderPayment(provider, providerPaymentId, rawEvent, subscription.id, invoiceResult.invoice_id);

      // Send notification to parent about upcoming payment
      await this._sendPaymentNotification('payment_scheduled', {
        subscriptionId: subscription.id,
        invoiceId: invoiceResult.invoice_id,
        payment: {
          amount,
          chargeDate
        }
      });

      console.log(`Created invoice ${invoiceResult.invoice_number} for payment ${providerPaymentId}`);

      return {
        invoiceCreated: true,
        invoiceId: invoiceResult.invoice_id,
        invoiceNumber: invoiceResult.invoice_number
      };
    } catch (error) {
      console.error(`Error creating invoice for payment ${providerPaymentId}:`, error);
      // Don't fail the webhook - just record the payment without invoice
      await this._recordProviderPayment(provider, providerPaymentId, rawEvent, null);
      return { invoiceCreated: false, error: error.message };
    }
  }

  /**
   * Record a provider payment in our database
   *
   * @private
   */
  async _recordProviderPayment(provider, providerPaymentId, rawEvent, subscriptionId, invoiceId = null) {
    // Check if payment already exists
    const existing = await this.db('provider_payments')
      .where({ provider, provider_payment_id: providerPaymentId })
      .first();

    if (existing) {
      // Update if invoice ID is being added
      if (invoiceId && !existing.invoice_id) {
        await this.db('provider_payments')
          .where({ id: existing.id })
          .update({ invoice_id: invoiceId, updated_at: new Date() });
      }
      return existing.id;
    }

    // Get mandate ID if available
    let mandateId = null;
    if (rawEvent?.links?.mandate) {
      const mandate = await this.db('payment_mandates')
        .where({ provider_mandate_id: rawEvent.links.mandate })
        .first();
      mandateId = mandate?.id;
    }

    const amountInPence = rawEvent?.amount || 0;
    const amount = amountInPence / 100;

    const [payment] = await this.db('provider_payments')
      .insert({
        subscription_id: subscriptionId,
        invoice_id: invoiceId,
        provider,
        provider_payment_id: providerPaymentId,
        payment_mandate_id: mandateId,
        amount,
        currency: rawEvent?.currency || 'GBP',
        status: rawEvent?.status || 'pending',
        charge_date: rawEvent?.charge_date,
        description: rawEvent?.description,
        metadata: { raw: rawEvent },
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('id');

    return payment?.id || payment;
  }

  /**
   * Activate pending subscriptions for a mandate
   *
   * When a mandate becomes active, find all pending subscriptions for the
   * parent user (in the same club) and activate them with this mandate.
   *
   * @private
   */
  async _activatePendingSubscriptions(providerMandateId) {
    // Get the local mandate with customer details
    const mandate = await this.db('payment_mandates as pm')
      .join('payment_customers as pc', 'pm.payment_customer_id', 'pc.id')
      .where({ 'pm.provider_mandate_id': providerMandateId })
      .select('pm.*', 'pc.user_id', 'pc.club_id')
      .first();

    if (!mandate) return;

    console.log(`[WebhookProcessor] Looking for pending subscriptions for parent ${mandate.user_id} in club ${mandate.club_id}`);

    // Find pending subscriptions for this parent in the same club
    // that don't have a mandate linked yet (or already linked to this mandate)
    const pendingSubscriptions = await this.db('subscriptions')
      .where('parent_user_id', mandate.user_id)
      .where('club_id', mandate.club_id)
      .where('status', 'pending')
      .where(function() {
        this.whereNull('payment_mandate_id')
          .orWhere('payment_mandate_id', mandate.id);
      });

    console.log(`[WebhookProcessor] Found ${pendingSubscriptions.length} pending subscriptions to activate`);

    for (const subscription of pendingSubscriptions) {
      try {
        console.log(`[WebhookProcessor] Activating subscription ${subscription.id} with mandate ${mandate.id}`);
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
    try {
      const { subscriptionId, invoiceId, payment } = data;

      // Fetch notification data
      const notificationData = await this._getNotificationData(subscriptionId, invoiceId);

      if (!notificationData || !notificationData.parentEmail) {
        console.log(`Cannot send ${templateKey} notification: missing parent email`);
        return;
      }

      const config = getConfig();
      const frontendUrl = config.frontendUrl || 'http://localhost:5173';

      // Build template data based on template type
      let templateData = {
        parentName: notificationData.parentName,
        childName: notificationData.childName,
        clubName: notificationData.clubName
      };

      switch (templateKey) {
        case 'payment_successful':
          templateData = {
            ...templateData,
            amount: this._formatCurrency(payment?.amount || notificationData.amount),
            paymentDate: new Date().toLocaleDateString('en-GB'),
            paymentReference: payment?.providerPaymentId || 'N/A',
            nextAmount: this._formatCurrency(notificationData.amount),
            nextPaymentDate: notificationData.nextBillingDate
              ? new Date(notificationData.nextBillingDate).toLocaleDateString('en-GB')
              : 'N/A'
          };
          break;

        case 'payment_failed':
          templateData = {
            ...templateData,
            amount: this._formatCurrency(payment?.amount || notificationData.amount),
            paymentDate: new Date().toLocaleDateString('en-GB'),
            failureReason: payment?.failureReason || 'Payment could not be processed',
            retryDays: '3',
            accountUrl: `${frontendUrl}/app/parent/billing/payment-methods`
          };
          break;

        case 'membership_suspended':
          templateData = {
            ...templateData,
            outstandingAmount: this._formatCurrency(notificationData.amount),
            failedAttempts: notificationData.failedPaymentCount || 3,
            accountUrl: `${frontendUrl}/app/parent/billing/payment-methods`
          };
          break;

        default:
          console.log(`Unknown notification template: ${templateKey}`);
          return;
      }

      // Send the email
      await this.emailOutbox.sendAndLog({
        to: notificationData.parentEmail,
        templateKey,
        templateData
      });

      console.log(`Sent ${templateKey} notification to ${notificationData.parentEmail}`);
    } catch (error) {
      // Don't fail webhook processing if email fails
      console.error(`Error sending ${templateKey} notification:`, error.message);
    }
  }

  /**
   * Get notification data for a subscription/invoice
   *
   * @private
   */
  async _getNotificationData(subscriptionId, invoiceId) {
    try {
      let subscription = null;

      if (subscriptionId) {
        subscription = await this.db('subscriptions as s')
          .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
          .join('clubs as c', 's.club_id', 'c.id')
          .join('users as parent', 's.parent_user_id', 'parent.id')
          .join('users as child', 's.child_user_id', 'child.id')
          .leftJoin('user_profiles as parent_profile', 's.parent_user_id', 'parent_profile.user_id')
          .leftJoin('user_profiles as child_profile', 's.child_user_id', 'child_profile.user_id')
          .where('s.id', subscriptionId)
          .select(
            's.id',
            's.amount',
            's.next_billing_date',
            's.failed_payment_count',
            'mt.name as tier_name',
            'c.name as club_name',
            'parent.email as parent_email',
            this.db.raw(`COALESCE(parent_profile.first_name, split_part(parent.email, '@', 1)) as parent_first_name`),
            this.db.raw(`COALESCE(parent_profile.last_name, '') as parent_last_name`),
            this.db.raw(`COALESCE(child_profile.first_name, split_part(child.email, '@', 1)) as child_first_name`),
            this.db.raw(`COALESCE(child_profile.last_name, '') as child_last_name`)
          )
          .first();
      }

      if (!subscription && invoiceId) {
        // Try to get data from invoice
        subscription = await this.db('invoices as i')
          .join('clubs as c', 'i.club_id', 'c.id')
          .join('users as parent', 'i.parent_user_id', 'parent.id')
          .join('users as child', 'i.child_user_id', 'child.id')
          .leftJoin('user_profiles as parent_profile', 'i.parent_user_id', 'parent_profile.user_id')
          .leftJoin('user_profiles as child_profile', 'i.child_user_id', 'child_profile.user_id')
          .where('i.id', invoiceId)
          .select(
            'i.id',
            'i.total_amount as amount',
            'c.name as club_name',
            'parent.email as parent_email',
            this.db.raw(`COALESCE(parent_profile.first_name, split_part(parent.email, '@', 1)) as parent_first_name`),
            this.db.raw(`COALESCE(parent_profile.last_name, '') as parent_last_name`),
            this.db.raw(`COALESCE(child_profile.first_name, split_part(child.email, '@', 1)) as child_first_name`),
            this.db.raw(`COALESCE(child_profile.last_name, '') as child_last_name`)
          )
          .first();
      }

      if (!subscription) {
        return null;
      }

      return {
        parentEmail: subscription.parent_email,
        parentName: `${subscription.parent_first_name} ${subscription.parent_last_name}`.trim(),
        childName: `${subscription.child_first_name} ${subscription.child_last_name}`.trim(),
        clubName: subscription.club_name,
        amount: subscription.amount,
        nextBillingDate: subscription.next_billing_date,
        failedPaymentCount: subscription.failed_payment_count
      };
    } catch (error) {
      console.error('Error fetching notification data:', error);
      return null;
    }
  }

  /**
   * Format currency amount
   *
   * @private
   */
  _formatCurrency(amount) {
    if (!amount) return '£0.00';
    return `£${parseFloat(amount).toFixed(2)}`;
  }

  /**
   * Log webhook to database
   *
   * @private
   * @param {Object} trx - Knex transaction
   */
  async _logWebhook(trx, provider, payload, signatureValid) {
    const events = parseWebhookEvents(provider, payload);
    const firstEvent = events[0] || {};

    const [webhook] = await trx('payment_webhooks')
      .insert({
        provider,
        event_id: firstEvent.id || `unknown_${Date.now()}`,
        resource_type: firstEvent.resourceType || 'unknown',
        action: firstEvent.action || 'unknown',
        resource_id: firstEvent.resourceId,
        payload: payload, // Store as JSON directly (webhook payloads are not sensitive)
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
   * @param {Object} trx - Knex transaction
   */
  async _markWebhookProcessed(trx, webhookId, results) {
    if (!webhookId) return;

    const hasErrors = results.some(r => !r.success);

    await trx('payment_webhooks')
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
