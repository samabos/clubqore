/**
 * Payment Retry Worker
 *
 * Runs periodically to retry failed payments.
 * Implements retry logic with increasing delays between attempts.
 */

import cron from 'node-cron';
import { SubscriptionBillingService } from '../payment/services/SubscriptionBillingService.js';
import { SubscriptionService } from '../payment/services/SubscriptionService.js';
import { getConfig } from '../config/index.js';
import logger from '../config/logger.js';

export class PaymentRetryWorker {
  constructor(db) {
    this.db = db;
    this.billingService = new SubscriptionBillingService(db);
    this.subscriptionService = new SubscriptionService(db);
    this.isRunning = false;
    this.job = null;

    // Get retry configuration
    const config = getConfig();
    this.maxRetries = config.billing?.retryMaxAttempts || 3;
    this.retryDays = config.billing?.retryDays || [3, 5, 7]; // Days after each failure
  }

  /**
   * Start the worker
   *
   * Runs every 4 hours
   */
  start() {
    // Schedule: Every 4 hours
    this.job = cron.schedule('0 */4 * * *', async () => {
      await this.processRetries();
    });

    logger.info('Payment Retry Worker started - Will run every 4 hours');
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('Payment Retry Worker stopped');
    }
  }

  /**
   * Process all eligible payment retries
   */
  async processRetries() {
    if (this.isRunning) {
      logger.warn('Payment retry already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    logger.info('Starting payment retry processing...');

    const stats = {
      eligible: 0,
      retried: 0,
      successful: 0,
      failed: 0,
      suspended: 0,
      errors: []
    };

    try {
      // Get failed payments eligible for retry
      const failedPayments = await this.billingService.getPaymentsForRetry(this.maxRetries);

      if (failedPayments.length === 0) {
        logger.info('No payments eligible for retry');
        return stats;
      }

      logger.info(`Found ${failedPayments.length} payment(s) eligible for retry`);

      // Filter by retry timing
      const paymentsToRetry = failedPayments.filter(payment =>
        this._isEligibleForRetry(payment)
      );

      stats.eligible = paymentsToRetry.length;
      logger.info(`${paymentsToRetry.length} payment(s) ready for retry`);

      // Process each payment
      for (const payment of paymentsToRetry) {
        try {
          const result = await this.billingService.retryPayment(payment.id);
          stats.retried++;

          if (result.status === 'failed') {
            stats.failed++;

            // Check if max retries reached
            if (result.retryCount >= this.maxRetries) {
              await this._suspendSubscription(payment.subscriptionId);
              stats.suspended++;
              logger.warn(`Subscription ${payment.subscriptionId} suspended after ${this.maxRetries} failed retries`);
            }
          } else {
            stats.successful++;
            logger.info(`Payment ${payment.id} retry initiated successfully`);
          }
        } catch (error) {
          stats.failed++;
          stats.errors.push({
            paymentId: payment.id,
            error: error.message
          });
          logger.error(`Error retrying payment ${payment.id}:`, error);
        }
      }

      logger.info(
        `Payment retry completed: ${stats.retried} retried, ` +
        `${stats.successful} initiated, ${stats.failed} failed, ${stats.suspended} suspended`
      );
    } catch (error) {
      logger.error('Error in payment retry worker:', error);
    } finally {
      this.isRunning = false;
    }

    return stats;
  }

  /**
   * Check if payment is eligible for retry based on timing
   *
   * @private
   * @param {Object} payment - Payment object
   * @returns {boolean} True if eligible for retry
   */
  _isEligibleForRetry(payment) {
    const lastFailure = new Date(payment.updatedAt || payment.createdAt);
    const now = new Date();
    const daysSinceFailure = Math.floor((now - lastFailure) / (1000 * 60 * 60 * 24));

    // Get the required delay for this retry attempt
    const retryIndex = Math.min(payment.retryCount, this.retryDays.length - 1);
    const requiredDays = this.retryDays[retryIndex];

    return daysSinceFailure >= requiredDays;
  }

  /**
   * Suspend subscription after max retries
   *
   * @private
   * @param {number} subscriptionId - Subscription ID
   */
  async _suspendSubscription(subscriptionId) {
    if (!subscriptionId) return;

    try {
      await this.subscriptionService.suspendSubscription(
        subscriptionId,
        { actorType: 'system', description: 'Maximum payment retry attempts exceeded' }
      );
    } catch (error) {
      logger.error(`Error suspending subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Manually trigger retries (for testing or admin use)
   */
  async triggerManually() {
    return this.processRetries();
  }
}

/**
 * Create and start the worker
 *
 * @param {Object} db - Knex database instance
 * @returns {PaymentRetryWorker} Worker instance
 */
export function startPaymentRetryWorker(db) {
  const worker = new PaymentRetryWorker(db);
  worker.start();
  return worker;
}

export default PaymentRetryWorker;
