/**
 * Subscription Billing Service
 *
 * Handles billing cycle management including invoice generation,
 * payment collection, and payment status handling.
 */

import { PaymentProviderFactory } from './PaymentProviderFactory.js';
import { SubscriptionService } from './SubscriptionService.js';
import { InvoiceService } from '../../billing/services/InvoiceService.js';

export class SubscriptionBillingService {
  constructor(db) {
    this.db = db;
    this.subscriptionService = new SubscriptionService(db);
    this.invoiceService = new InvoiceService(db);
  }

  /**
   * Generate invoice from subscription
   *
   * Creates an invoice for the current billing period.
   *
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Created invoice
   */
  async generateSubscriptionInvoice(subscriptionId) {
    const subscription = await this.db('subscriptions as s')
      .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
      .where('s.id', subscriptionId)
      .select('s.*', 'mt.name as tier_name')
      .first();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Create invoice
    const invoiceData = {
      user_id: subscription.child_user_id,
      season_id: null, // Subscription invoices are not seasonal
      invoice_type: 'subscription',
      issue_date: new Date(),
      due_date: subscription.next_billing_date || new Date(),
      notes: `Subscription: ${subscription.tier_name} (${subscription.billing_frequency})`,
      items: [{
        description: `${subscription.tier_name} - ${subscription.billing_frequency === 'annual' ? 'Annual' : 'Monthly'} subscription`,
        category: 'membership',
        quantity: 1,
        unit_price: subscription.amount
      }]
    };

    const invoice = await this.invoiceService.createInvoice(
      subscription.club_id,
      invoiceData,
      null // System-generated
    );

    // Link invoice to subscription
    await this.db('provider_payments').insert({
      subscription_id: subscriptionId,
      invoice_id: invoice.id,
      provider: 'pending', // Will be set when payment is created
      provider_payment_id: `pending_${invoice.id}`,
      amount: subscription.amount,
      currency: 'GBP',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    return invoice;
  }

  /**
   * Collect payment for a subscription
   *
   * Creates a payment with the payment provider for the subscription amount.
   *
   * @param {number} subscriptionId - Subscription ID
   * @param {number} invoiceId - Optional invoice ID to link payment to
   * @returns {Promise<Object>} Created payment
   */
  async collectPayment(subscriptionId, invoiceId = null) {
    const subscription = await this.db('subscriptions as s')
      .join('payment_mandates as pm', 's.payment_mandate_id', 'pm.id')
      .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
      .where('s.id', subscriptionId)
      .select(
        's.*',
        'pm.provider',
        'pm.provider_mandate_id',
        'pm.status as mandate_status',
        'mt.name as tier_name'
      )
      .first();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!subscription.payment_mandate_id) {
      throw new Error('Subscription has no payment mandate');
    }

    if (subscription.mandate_status !== 'active') {
      throw new Error(`Mandate is not active (status: ${subscription.mandate_status})`);
    }

    // Get provider instance
    const provider = PaymentProviderFactory.getProvider(subscription.provider);

    // Create payment in provider
    const paymentResult = await provider.createPayment(
      subscription.provider_mandate_id,
      {
        amount: subscription.amount,
        currency: 'GBP',
        description: `${subscription.tier_name} subscription`,
        metadata: {
          subscriptionId: subscriptionId.toString(),
          invoiceId: invoiceId?.toString()
        }
      }
    );

    // Store payment record
    const [payment] = await this.db('provider_payments')
      .insert({
        subscription_id: subscriptionId,
        invoice_id: invoiceId,
        provider: subscription.provider,
        provider_payment_id: paymentResult.providerPaymentId,
        payment_mandate_id: subscription.payment_mandate_id,
        amount: subscription.amount,
        currency: 'GBP',
        status: paymentResult.status,
        charge_date: paymentResult.chargeDate,
        description: paymentResult.description,
        retry_count: 0,
        metadata: JSON.stringify({
          tierName: subscription.tier_name,
          billingFrequency: subscription.billing_frequency
        }),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return this.formatPayment(payment);
  }

  /**
   * Process billing for a subscription
   *
   * Full billing cycle: generate invoice, collect payment, update subscription.
   *
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Billing result
   */
  async processBillingCycle(subscriptionId) {
    return await this.db.transaction(async (trx) => {
      const subscription = await trx('subscriptions')
        .where({ id: subscriptionId })
        .first();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status !== 'active') {
        throw new Error('Subscription is not active');
      }

      // Generate invoice
      const invoice = await this.generateSubscriptionInvoice(subscriptionId);

      // Collect payment
      let payment;
      try {
        payment = await this.collectPayment(subscriptionId, invoice.id);
      } catch (error) {
        // If payment collection fails, still advance the billing date
        // The payment retry worker will handle retries
        console.error(`Payment collection failed for subscription ${subscriptionId}:`, error.message);
        payment = { error: error.message };
      }

      // Update subscription billing dates
      const now = new Date();
      const newPeriodStart = now;
      let newPeriodEnd;
      let newNextBillingDate;

      if (subscription.billing_frequency === 'annual') {
        newPeriodEnd = new Date(now);
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
        newNextBillingDate = new Date(newPeriodEnd);
      } else {
        newPeriodEnd = new Date(now);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        newNextBillingDate = new Date(newPeriodEnd);
      }

      // Set next billing date to the correct day of month
      const billingDay = subscription.billing_day_of_month || 1;
      const lastDayOfMonth = new Date(newNextBillingDate.getFullYear(), newNextBillingDate.getMonth() + 1, 0).getDate();
      newNextBillingDate.setDate(Math.min(billingDay, lastDayOfMonth));

      await trx('subscriptions')
        .where({ id: subscriptionId })
        .update({
          current_period_start: newPeriodStart,
          current_period_end: newPeriodEnd,
          next_billing_date: newNextBillingDate,
          updated_at: new Date()
        });

      return {
        subscriptionId,
        invoice,
        payment,
        newPeriodStart,
        newPeriodEnd,
        nextBillingDate: newNextBillingDate
      };
    });
  }

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

  /**
   * Get subscriptions due for billing
   *
   * @param {Date} date - Date to check (defaults to today)
   * @returns {Promise<Array>} List of due subscriptions
   */
  async getDueSubscriptions(date = new Date()) {
    const targetDate = new Date(date);
    targetDate.setHours(23, 59, 59, 999);

    const subscriptions = await this.db('subscriptions as s')
      .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
      .join('payment_mandates as pm', 's.payment_mandate_id', 'pm.id')
      .where('s.status', 'active')
      .where('pm.status', 'active')
      .where('s.next_billing_date', '<=', targetDate)
      .select(
        's.*',
        'mt.name as tier_name',
        'pm.provider',
        'pm.provider_mandate_id'
      );

    return subscriptions;
  }

  /**
   * Get failed payments eligible for retry
   *
   * @param {number} maxRetries - Maximum retry count (default 3)
   * @returns {Promise<Array>} List of payments to retry
   */
  async getPaymentsForRetry(maxRetries = 3) {
    const payments = await this.db('provider_payments as pp')
      .join('subscriptions as s', 'pp.subscription_id', 's.id')
      .join('payment_mandates as pm', 's.payment_mandate_id', 'pm.id')
      .where('pp.status', 'failed')
      .where('pp.retry_count', '<', maxRetries)
      .where('pm.status', 'active')
      .where('s.status', 'active')
      .select(
        'pp.*',
        's.club_id',
        'pm.provider',
        'pm.provider_mandate_id'
      );

    return payments.map(p => this.formatPayment(p));
  }

  /**
   * Retry a failed payment
   *
   * @param {number} paymentId - Provider payment ID (local)
   * @returns {Promise<Object>} Retry result
   */
  async retryPayment(paymentId) {
    const payment = await this.db('provider_payments as pp')
      .join('payment_mandates as pm', 'pp.payment_mandate_id', 'pm.id')
      .where('pp.id', paymentId)
      .select('pp.*', 'pm.provider', 'pm.provider_mandate_id')
      .first();

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Get provider instance
    const provider = PaymentProviderFactory.getProvider(payment.provider);

    // Create new payment (can't retry, must create new)
    const newPayment = await provider.createPayment(
      payment.provider_mandate_id,
      {
        amount: payment.amount,
        currency: payment.currency,
        description: `Retry: ${payment.description || 'Subscription payment'}`,
        metadata: {
          originalPaymentId: payment.provider_payment_id,
          retryCount: payment.retry_count + 1
        }
      }
    );

    // Update original payment
    await this.db('provider_payments')
      .where({ id: paymentId })
      .update({
        provider_payment_id: newPayment.providerPaymentId,
        status: newPayment.status,
        charge_date: newPayment.chargeDate,
        retry_count: payment.retry_count + 1,
        failure_reason: null,
        updated_at: new Date()
      });

    return {
      paymentId,
      newProviderPaymentId: newPayment.providerPaymentId,
      status: newPayment.status,
      chargeDate: newPayment.chargeDate,
      retryCount: payment.retry_count + 1
    };
  }

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
