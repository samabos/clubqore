/**
 * Notification Retry Worker
 *
 * Retries failed email/notification sends from the email outbox.
 * Runs periodically to pick up any notifications that failed to send
 * and retries them with exponential backoff.
 */

import cron from 'node-cron';
import { EmailOutboxService } from '../shared/services/emailOutboxService.js';
import { emailService } from '../shared/services/emailService.js';
import { WorkerExecutionService } from '../payment/services/WorkerExecutionService.js';
import logger from '../config/logger.js';

export class NotificationRetryWorker {
  constructor(db) {
    this.db = db;
    this.emailOutbox = new EmailOutboxService(db, emailService);
    this.executionService = new WorkerExecutionService(db);
    this.isRunning = false;
    this.job = null;
  }

  /**
   * Start the worker
   *
   * Runs every 15 minutes
   */
  start() {
    // Schedule: Every 15 minutes
    this.job = cron.schedule('*/15 * * * *', async () => {
      await this.processRetries();
    });

    logger.info('Notification Retry Worker started - Will run every 15 minutes');
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('Notification Retry Worker stopped');
    }
  }

  /**
   * Process failed notifications for retry
   */
  async processRetries() {
    if (this.isRunning) {
      logger.warn('Notification retry already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    let executionId = null;

    const stats = {
      processed: 0,
      successful: 0,
      failed: 0
    };

    try {
      // Track execution start
      executionId = await this.executionService.startExecution('notification_retry');
      logger.info('Starting notification retry processing...');

      // Get failed notifications from email outbox that are eligible for retry
      const failedNotifications = await this._getFailedNotifications();

      if (failedNotifications.length === 0) {
        logger.info('No failed notifications to retry');
        await this.executionService.completeExecution(executionId, stats);
        return stats;
      }

      logger.info(`Found ${failedNotifications.length} failed notification(s) to retry`);

      // Process each failed notification
      for (const notification of failedNotifications) {
        stats.processed++;
        try {
          await this._retryNotification(notification);
          stats.successful++;
        } catch (error) {
          stats.failed++;
          logger.error(`Failed to retry notification ${notification.id}:`, error);
        }
      }

      logger.info(
        `Notification retry complete: ${stats.successful} succeeded, ${stats.failed} failed`
      );

      // Track execution complete
      await this.executionService.completeExecution(executionId, stats);
    } catch (error) {
      logger.error('Error in notification retry worker:', error);
      if (executionId) {
        await this.executionService.failExecution(executionId, error.message);
      }
    } finally {
      this.isRunning = false;
    }

    return stats;
  }

  /**
   * Get failed notifications eligible for retry
   *
   * @private
   */
  async _getFailedNotifications() {
    // Get notifications that:
    // 1. Have status 'failed'
    // 2. Have retry_count < max_retries (default 3)
    // 3. Haven't been retried in the last backoff period
    const maxRetries = 3;
    const backoffMinutes = 15; // Minimum time between retries

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - backoffMinutes);

    return this.db('email_outbox')
      .where('status', 'failed')
      .where('retry_count', '<', maxRetries)
      .where(function() {
        this.whereNull('last_retry_at')
          .orWhere('last_retry_at', '<', cutoffTime);
      })
      .orderBy('created_at', 'asc')
      .limit(50); // Process up to 50 at a time
  }

  /**
   * Retry sending a notification
   *
   * @private
   */
  async _retryNotification(notification) {
    try {
      // Attempt to send the email
      await emailService.sendEmail({
        to: notification.to_email,
        subject: notification.subject,
        text: notification.text_content,
        html: notification.html_content
      });

      // Mark as sent
      await this.db('email_outbox')
        .where('id', notification.id)
        .update({
          status: 'sent',
          sent_at: new Date(),
          retry_count: notification.retry_count + 1,
          last_retry_at: new Date(),
          updated_at: new Date()
        });

      logger.info(`Successfully retried notification ${notification.id} to ${notification.to_email}`);
    } catch (error) {
      // Update retry count and last error
      await this.db('email_outbox')
        .where('id', notification.id)
        .update({
          retry_count: notification.retry_count + 1,
          last_retry_at: new Date(),
          last_error: error.message,
          updated_at: new Date()
        });

      throw error;
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
 * @returns {NotificationRetryWorker} Worker instance
 */
export function startNotificationRetryWorker(db) {
  const worker = new NotificationRetryWorker(db);
  worker.start();
  return worker;
}

export default NotificationRetryWorker;
