/**
 * Subscription Notification Worker
 *
 * Runs daily to send subscription-related notifications:
 * - Upcoming billing reminders
 * - Payment confirmations
 * - Subscription status updates
 */

import cron from 'node-cron';
import { emailService } from '../services/emailService.js';
import { getConfig } from '../config/index.js';
import logger from '../config/logger.js';

export class SubscriptionNotificationWorker {
  constructor(db) {
    this.db = db;
    this.isRunning = false;
    this.job = null;

    const config = getConfig();
    this.reminderDaysBefore = config.billing?.reminderDaysBefore || 3;
  }

  /**
   * Start the worker
   *
   * Runs daily at 9:00 AM
   */
  start() {
    // Schedule: Every day at 9:00 AM
    this.job = cron.schedule('0 9 * * *', async () => {
      await this.processNotifications();
    });

    logger.info('Subscription Notification Worker started - Will run daily at 9:00 AM');
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('Subscription Notification Worker stopped');
    }
  }

  /**
   * Process all notifications
   */
  async processNotifications() {
    if (this.isRunning) {
      logger.warn('Subscription notifications already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    logger.info('Starting subscription notification processing...');

    const stats = {
      upcomingBillingReminders: 0,
      pausedSubscriptionReminders: 0,
      suspensionWarnings: 0,
      errors: []
    };

    try {
      // Send upcoming billing reminders
      stats.upcomingBillingReminders = await this._sendUpcomingBillingReminders();

      // Send reminders for paused subscriptions about to resume
      stats.pausedSubscriptionReminders = await this._sendPausedSubscriptionReminders();

      // Send warnings for subscriptions at risk of suspension
      stats.suspensionWarnings = await this._sendSuspensionWarnings();

      logger.info(
        `Notifications sent: ${stats.upcomingBillingReminders} billing reminders, ` +
        `${stats.pausedSubscriptionReminders} pause reminders, ${stats.suspensionWarnings} suspension warnings`
      );
    } catch (error) {
      logger.error('Error in subscription notification worker:', error);
      stats.errors.push(error.message);
    } finally {
      this.isRunning = false;
    }

    return stats;
  }

  /**
   * Send upcoming billing reminders
   *
   * @private
   */
  async _sendUpcomingBillingReminders() {
    let sent = 0;

    try {
      // Calculate the reminder date
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + this.reminderDaysBefore);
      reminderDate.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get subscriptions billing on the reminder date
      const subscriptions = await this.db('subscriptions as s')
        .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
        .join('users as parent', 's.parent_user_id', 'parent.id')
        .join('users as child', 's.child_user_id', 'child.id')
        .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
        .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
        .leftJoin('clubs as c', 's.club_id', 'c.id')
        .where('s.status', 'active')
        .whereBetween('s.next_billing_date', [today, reminderDate])
        .select(
          's.id',
          's.amount',
          's.billing_frequency',
          's.next_billing_date',
          'mt.name as tier_name',
          'parent.email as parent_email',
          'parent_profile.first_name as parent_first_name',
          'child_profile.first_name as child_first_name',
          'child_profile.last_name as child_last_name',
          'c.name as club_name'
        );

      for (const subscription of subscriptions) {
        try {
          // Check if we already sent a reminder for this billing date
          const alreadySent = await this._hasNotificationBeenSent(
            subscription.id,
            'payment_upcoming',
            subscription.next_billing_date
          );

          if (alreadySent) continue;

          await this._sendNotification('payment_upcoming', {
            to: subscription.parent_email,
            parentName: subscription.parent_first_name,
            childName: `${subscription.child_first_name} ${subscription.child_last_name}`,
            tierName: subscription.tier_name,
            clubName: subscription.club_name,
            amount: subscription.amount,
            billingDate: subscription.next_billing_date,
            billingFrequency: subscription.billing_frequency
          });

          await this._recordNotification(subscription.id, 'payment_upcoming', subscription.next_billing_date);
          sent++;
        } catch (error) {
          logger.error(`Error sending billing reminder for subscription ${subscription.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error fetching subscriptions for billing reminders:', error);
    }

    return sent;
  }

  /**
   * Send reminders for paused subscriptions about to resume
   *
   * @private
   */
  async _sendPausedSubscriptionReminders() {
    let sent = 0;

    try {
      // Get paused subscriptions resuming in next 3 days
      const resumeDate = new Date();
      resumeDate.setDate(resumeDate.getDate() + 3);

      const subscriptions = await this.db('subscriptions as s')
        .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
        .join('users as parent', 's.parent_user_id', 'parent.id')
        .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
        .leftJoin('clubs as c', 's.club_id', 'c.id')
        .where('s.status', 'paused')
        .whereNotNull('s.resume_date')
        .where('s.resume_date', '<=', resumeDate)
        .select(
          's.id',
          's.resume_date',
          's.amount',
          'mt.name as tier_name',
          'parent.email as parent_email',
          'parent_profile.first_name as parent_first_name',
          'c.name as club_name'
        );

      for (const subscription of subscriptions) {
        try {
          const alreadySent = await this._hasNotificationBeenSent(
            subscription.id,
            'subscription_resuming',
            subscription.resume_date
          );

          if (alreadySent) continue;

          await this._sendNotification('subscription_resuming', {
            to: subscription.parent_email,
            parentName: subscription.parent_first_name,
            tierName: subscription.tier_name,
            clubName: subscription.club_name,
            resumeDate: subscription.resume_date,
            amount: subscription.amount
          });

          await this._recordNotification(subscription.id, 'subscription_resuming', subscription.resume_date);
          sent++;
        } catch (error) {
          logger.error(`Error sending resume reminder for subscription ${subscription.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error fetching paused subscriptions:', error);
    }

    return sent;
  }

  /**
   * Send warnings for subscriptions at risk of suspension
   *
   * @private
   */
  async _sendSuspensionWarnings() {
    let sent = 0;

    try {
      // Get subscriptions with 2 failed payments (1 more = suspension)
      const subscriptions = await this.db('subscriptions as s')
        .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
        .join('users as parent', 's.parent_user_id', 'parent.id')
        .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
        .leftJoin('clubs as c', 's.club_id', 'c.id')
        .where('s.status', 'active')
        .where('s.failed_payment_count', 2)
        .select(
          's.id',
          's.failed_payment_count',
          's.last_failed_payment_date',
          'mt.name as tier_name',
          'parent.email as parent_email',
          'parent_profile.first_name as parent_first_name',
          'c.name as club_name'
        );

      for (const subscription of subscriptions) {
        try {
          // Only send once per failure event
          const alreadySent = await this._hasNotificationBeenSent(
            subscription.id,
            'suspension_warning',
            subscription.last_failed_payment_date
          );

          if (alreadySent) continue;

          await this._sendNotification('suspension_warning', {
            to: subscription.parent_email,
            parentName: subscription.parent_first_name,
            tierName: subscription.tier_name,
            clubName: subscription.club_name,
            failedAttempts: subscription.failed_payment_count
          });

          await this._recordNotification(subscription.id, 'suspension_warning', subscription.last_failed_payment_date);
          sent++;
        } catch (error) {
          logger.error(`Error sending suspension warning for subscription ${subscription.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error fetching at-risk subscriptions:', error);
    }

    return sent;
  }

  /**
   * Send a notification email
   *
   * @private
   */
  async _sendNotification(templateKey, data) {
    // This integrates with the email service
    // For now, log it and call email service if available
    logger.info(`Sending ${templateKey} notification to ${data.to}`);

    try {
      // Use existing email service pattern
      if (emailService && emailService.sendEmail) {
        await emailService.sendEmail({
          to: data.to,
          subject: this._getSubjectForTemplate(templateKey, data),
          text: this._getTextForTemplate(templateKey, data)
          // html: await emailService.renderTemplate(templateKey, data)
        });
      }
    } catch (error) {
      logger.error(`Error sending notification email:`, error);
      throw error;
    }
  }

  /**
   * Get email subject for template
   *
   * @private
   */
  _getSubjectForTemplate(templateKey, data) {
    const subjects = {
      'payment_upcoming': `Upcoming payment reminder - ${data.clubName}`,
      'subscription_resuming': `Your subscription is resuming soon - ${data.clubName}`,
      'suspension_warning': `Action required: Payment issue with your subscription - ${data.clubName}`
    };
    return subjects[templateKey] || 'Subscription notification';
  }

  /**
   * Get plain text for template
   *
   * @private
   */
  _getTextForTemplate(templateKey, data) {
    switch (templateKey) {
      case 'payment_upcoming':
        return `Hi ${data.parentName},\n\n` +
          `This is a reminder that your ${data.tierName} subscription ` +
          `for ${data.childName} at ${data.clubName} will be billed on ` +
          `${new Date(data.billingDate).toLocaleDateString()}.\n\n` +
          `Amount: £${data.amount}\n\n` +
          `If you need to update your payment method, please log in to your account.`;

      case 'subscription_resuming':
        return `Hi ${data.parentName},\n\n` +
          `Your paused ${data.tierName} subscription at ${data.clubName} ` +
          `will resume on ${new Date(data.resumeDate).toLocaleDateString()}.\n\n` +
          `You will be billed £${data.amount} when the subscription resumes.`;

      case 'suspension_warning':
        return `Hi ${data.parentName},\n\n` +
          `We've been unable to collect payment for your ${data.tierName} subscription ` +
          `at ${data.clubName}.\n\n` +
          `This is attempt ${data.failedAttempts} of 3. If the next attempt fails, ` +
          `your subscription will be suspended.\n\n` +
          `Please update your payment method to avoid interruption.`;

      default:
        return 'You have a subscription notification.';
    }
  }

  /**
   * Check if notification was already sent
   *
   * @private
   */
  async _hasNotificationBeenSent(subscriptionId, notificationType, referenceDate) {
    const event = await this.db('subscription_events')
      .where({
        subscription_id: subscriptionId,
        event_type: `notification_${notificationType}`
      })
      .where('created_at', '>=', new Date(referenceDate))
      .first();

    return !!event;
  }

  /**
   * Record that notification was sent
   *
   * @private
   */
  async _recordNotification(subscriptionId, notificationType, referenceDate) {
    await this.db('subscription_events').insert({
      subscription_id: subscriptionId,
      event_type: `notification_${notificationType}`,
      description: `Sent ${notificationType} notification`,
      actor_type: 'system',
      metadata: JSON.stringify({ referenceDate }),
      created_at: new Date()
    });
  }

  /**
   * Manually trigger notifications (for testing or admin use)
   */
  async triggerManually() {
    return this.processNotifications();
  }
}

/**
 * Create and start the worker
 *
 * @param {Object} db - Knex database instance
 * @returns {SubscriptionNotificationWorker} Worker instance
 */
export function startSubscriptionNotificationWorker(db) {
  const worker = new SubscriptionNotificationWorker(db);
  worker.start();
  return worker;
}

export default SubscriptionNotificationWorker;
