/**
 * Subscription Billing Service
 *
 * Handles payment status updates from webhooks.
 * Note: Payment scheduling and retries are handled by GoCardless Subscriptions API.
 * This service is used by WebhookProcessorService to sync payment outcomes to our records.
 */

import { SubscriptionService } from './SubscriptionService.js';
import { InvoiceService } from '../../billing/services/InvoiceService.js';

export class SubscriptionBillingService {
  constructor(db) {
    this.db = db;
    this.subscriptionService = new SubscriptionService(db);
    this.invoiceService = new InvoiceService(db);
  }

  // Note: generateSubscriptionInvoice, collectPayment, processBillingCycle removed
  // Invoices are now auto-generated via GoCardless webhooks (payments.created)
  // Payment collection is handled by GoCardless Subscriptions API

  /**
   * Handle successful payment
   *
   * Updates invoice, subscription, and resets failed payment count.
   *
   * @param {string} provider - Payment provider name
   * @param {string} providerPaymentId - Provider's payment ID
   * @returns {Promise<Object>} Updated payment and subscription
   */
  async handlePaymentSuccess(provider, providerPaymentId) {
    const payment = await this.db('provider_payments')
      .where({ provider, provider_payment_id: providerPaymentId })
      .first();

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Update payment status
    await this.db('provider_payments')
      .where({ id: payment.id })
      .update({
        status: 'paid_out',
        paid_out_at: new Date(),
        updated_at: new Date()
      });

    // Update invoice if linked
    if (payment.invoice_id) {
      await this.invoiceService.markInvoiceAsPaid(
        payment.invoice_id,
        null, // clubId not needed for internal call
        {
          payment_method: 'direct_debit',
          payment_date: new Date(),
          amount: payment.amount,
          reference_number: providerPaymentId
        }
      );
    }

    // Reset failed payment count on subscription
    if (payment.subscription_id) {
      await this.subscriptionService.resetFailedPaymentCount(payment.subscription_id);
    }

    return {
      payment: this.formatPayment(payment),
      invoiceId: payment.invoice_id,
      subscriptionId: payment.subscription_id
    };
  }

  /**
   * Handle failed payment
   *
   * Records failure, increments retry count, and may suspend subscription.
   *
   * @param {string} provider - Payment provider name
   * @param {string} providerPaymentId - Provider's payment ID
   * @param {string} failureReason - Reason for failure
   * @returns {Promise<Object>} Updated payment and subscription status
   */
  async handlePaymentFailure(provider, providerPaymentId, failureReason) {
    const payment = await this.db('provider_payments')
      .where({ provider, provider_payment_id: providerPaymentId })
      .first();

    if (!payment) {
      throw new Error('Payment not found');
    }

    const newRetryCount = (payment.retry_count || 0) + 1;

    // Update payment status
    await this.db('provider_payments')
      .where({ id: payment.id })
      .update({
        status: 'failed',
        failure_reason: failureReason,
        retry_count: newRetryCount,
        updated_at: new Date()
      });

    let subscriptionSuspended = false;

    // Update subscription failed payment count
    if (payment.subscription_id) {
      await this.subscriptionService.recordFailedPayment(payment.subscription_id);

      // Check if we should suspend
      const subscription = await this.db('subscriptions')
        .where({ id: payment.subscription_id })
        .first();

      if (subscription && subscription.failed_payment_count >= 3) {
        await this.subscriptionService.suspendSubscription(
          payment.subscription_id,
          { actorType: 'system' }
        );
        subscriptionSuspended = true;
      }
    }

    return {
      payment: this.formatPayment(payment),
      retryCount: newRetryCount,
      subscriptionSuspended,
      subscriptionId: payment.subscription_id
    };
  }

  // Note: getDueSubscriptions, getPaymentsForRetry, retryPayment removed
  // GoCardless Subscriptions API handles payment scheduling and Success+ handles retries

  /**
   * Calculate proration for tier change
   *
   * @param {Object} subscription - Subscription object
   * @param {Object} newTier - New tier object
   * @returns {Object} Proration details
   */
  calculateProration(subscription, newTier) {
    const now = new Date();
    const periodStart = new Date(subscription.current_period_start);
    const periodEnd = new Date(subscription.current_period_end);

    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));

    const currentAmount = parseFloat(subscription.amount);
    const newAmount = subscription.billing_frequency === 'annual' && newTier.annual_price
      ? parseFloat(newTier.annual_price)
      : parseFloat(newTier.monthly_price);

    const currentDailyRate = currentAmount / totalDays;
    const newDailyRate = newAmount / totalDays;

    const creditForUnused = currentDailyRate * daysRemaining;
    const chargeForNew = newDailyRate * daysRemaining;
    const netAmount = chargeForNew - creditForUnused;

    return {
      daysRemaining,
      totalDays,
      creditForUnused: Math.round(creditForUnused * 100) / 100,
      chargeForNew: Math.round(chargeForNew * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      isUpgrade: newAmount > currentAmount,
      effectiveDate: now
    };
  }

  /**
   * Format payment from database row
   * @private
   */
  formatPayment(payment) {
    return {
      id: payment.id,
      subscriptionId: payment.subscription_id,
      invoiceId: payment.invoice_id,
      provider: payment.provider,
      providerPaymentId: payment.provider_payment_id,
      paymentMandateId: payment.payment_mandate_id,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      status: payment.status,
      chargeDate: payment.charge_date,
      description: payment.description,
      failureReason: payment.failure_reason,
      retryCount: payment.retry_count,
      payoutId: payment.payout_id,
      paidOutAt: payment.paid_out_at,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    };
  }
}

export default SubscriptionBillingService;
