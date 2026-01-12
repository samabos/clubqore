/**
 * Subscription Billing Worker
 *
 * Runs daily to process subscription billing cycles.
 * Generates invoices and initiates payment collection for due subscriptions.
 */

import cron from 'node-cron';
import { SubscriptionBillingService } from '../payment/services/SubscriptionBillingService.js';
import { SubscriptionService } from '../payment/services/SubscriptionService.js';
import logger from '../config/logger.js';

export class SubscriptionBillingWorker {
  constructor(db) {
    this.db = db;
    this.billingService = new SubscriptionBillingService(db);
    this.subscriptionService = new SubscriptionService(db);
    this.isRunning = false;
    this.job = null;
  }

  /**
   * Start the worker
   *
   * Runs daily at 6:00 AM
   */
  start() {
    // Schedule: Every day at 6:00 AM
    this.job = cron.schedule('0 6 * * *', async () => {
      await this.processBillingCycles();
    });

    logger.info('Subscription Billing Worker started - Will run daily at 6:00 AM');
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('Subscription Billing Worker stopped');
    }
  }

  /**
   * Process all due billing cycles
   */
  async processBillingCycles() {
    if (this.isRunning) {
      logger.warn('Subscription billing already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    logger.info('Starting subscription billing cycle processing...');

    const stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get all subscriptions due for billing
      const dueSubscriptions = await this.billingService.getDueSubscriptions();

      if (dueSubscriptions.length === 0) {
        logger.info('No subscriptions due for billing');
        return;
      }

      logger.info(`Found ${dueSubscriptions.length} subscription(s) due for billing`);

      // Process each subscription
      for (const subscription of dueSubscriptions) {
        stats.processed++;

        try {
          const result = await this.billingService.processBillingCycle(subscription.id);

          if (result.payment?.error) {
            stats.failed++;
            stats.errors.push({
              subscriptionId: subscription.id,
              error: result.payment.error
            });
            logger.warn(`Billing failed for subscription ${subscription.id}: ${result.payment.error}`);
          } else {
            stats.successful++;
            logger.info(`Billing completed for subscription ${subscription.id}`);
          }
        } catch (error) {
          stats.failed++;
          stats.errors.push({
            subscriptionId: subscription.id,
            error: error.message
          });
          logger.error(`Error processing subscription ${subscription.id}:`, error);
        }
      }

      logger.info(
        `Subscription billing completed: ${stats.processed} processed, ` +
        `${stats.successful} successful, ${stats.failed} failed`
      );
    } catch (error) {
      logger.error('Error in subscription billing worker:', error);
    } finally {
      this.isRunning = false;
    }

    return stats;
  }

  /**
   * Manually trigger billing (for testing or admin use)
   */
  async triggerManually() {
    return this.processBillingCycles();
  }
}

/**
 * Create and start the worker
 *
 * @param {Object} db - Knex database instance
 * @returns {SubscriptionBillingWorker} Worker instance
 */
export function startSubscriptionBillingWorker(db) {
  const worker = new SubscriptionBillingWorker(db);
  worker.start();
  return worker;
}

export default SubscriptionBillingWorker;
