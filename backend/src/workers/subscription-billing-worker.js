/**
 * Subscription Billing Worker
 *
 * Runs daily to process subscription billing cycles.
 * Generates invoices and initiates payment collection for due subscriptions.
 */

import cron from 'node-cron';
import { SubscriptionBillingService } from '../payment/services/SubscriptionBillingService.js';
import { SubscriptionService } from '../payment/services/SubscriptionService.js';
import { WorkerExecutionService } from '../payment/services/WorkerExecutionService.js';
import logger from '../config/logger.js';

export class SubscriptionBillingWorker {
  constructor(db) {
    this.db = db;
    this.billingService = new SubscriptionBillingService(db);
    this.subscriptionService = new SubscriptionService(db);
    this.executionService = new WorkerExecutionService(db);
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
    let executionId = null;

    const stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      // Track execution start
      executionId = await this.executionService.startExecution('subscription_billing');
      logger.info('Starting subscription billing cycle processing...');

      // Get all subscriptions due for billing
      const dueSubscriptions = await this.billingService.getDueSubscriptions();

      if (dueSubscriptions.length === 0) {
        logger.info('No subscriptions due for billing');
        await this.executionService.completeExecution(executionId, stats);
        return stats;
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

      // Track execution complete
      await this.executionService.completeExecution(executionId, {
        processed: stats.processed,
        successful: stats.successful,
        failed: stats.failed,
        metadata: { errors: stats.errors }
      });
    } catch (error) {
      logger.error('Error in subscription billing worker:', error);
      if (executionId) {
        await this.executionService.failExecution(executionId, error.message);
      }
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
