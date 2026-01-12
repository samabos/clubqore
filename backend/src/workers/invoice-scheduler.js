import cron from 'node-cron';
import { InvoiceService } from '../club/services/InvoiceService.js';
import { BillingSettingsService } from '../club/services/BillingSettingsService.js';
import { ScheduledInvoiceJobService } from '../club/services/ScheduledInvoiceJobService.js';
import { emailService } from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * Invoice Scheduler Worker
 * Runs daily to check for pending scheduled invoice jobs and generates invoices automatically
 */
export class InvoiceScheduler {
  constructor(db) {
    this.db = db;
    this.invoiceService = new InvoiceService(db);
    this.billingSettingsService = new BillingSettingsService(db);
    this.scheduledJobService = new ScheduledInvoiceJobService(db);
    this.isRunning = false;
  }

  /**
   * Start the scheduler - runs daily at 6:00 AM
   */
  start() {
    // Schedule: Every day at 6:00 AM (0 6 * * *)
    // For testing, you can use: '*/5 * * * *' (every 5 minutes)
    this.job = cron.schedule('0 6 * * *', async () => {
      await this.processPendingJobs();
    });

    logger.info('📅 Invoice Scheduler started - Will run daily at 6:00 AM');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('📅 Invoice Scheduler stopped');
    }
  }

  /**
   * Process all pending scheduled jobs
   */
  async processPendingJobs() {
    if (this.isRunning) {
      logger.warn('Invoice scheduler job already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    logger.info('🔄 Starting invoice scheduler job...');

    try {
      // Get all pending jobs that should be executed
      const pendingJobs = await this.scheduledJobService.getPendingJobs();

      if (pendingJobs.length === 0) {
        logger.info('✅ No pending invoice jobs to process');
        return;
      }

      logger.info(`📋 Found ${pendingJobs.length} pending job(s) to process`);

      // Process each job
      for (const job of pendingJobs) {
        await this.processJob(job);
      }

      logger.info('✅ Invoice scheduler job completed successfully');
    } catch (error) {
      logger.error('❌ Error in invoice scheduler:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single scheduled job
   */
  async processJob(job) {
    const { id: jobId, club_id, season_id, club_name, season_name } = job;

    logger.info(`🔨 Processing job #${jobId} for ${club_name} - ${season_name}`);

    try {
      // Get billing settings
      const settings = await this.billingSettingsService.getSettings(club_id);

      if (!settings || !settings.auto_generation_enabled) {
        logger.warn(`⚠️ Auto-generation disabled for club ${club_name}, skipping job #${jobId}`);
        await this.scheduledJobService.markJobFailed(
          jobId,
          'Auto-generation is disabled for this club'
        );
        return;
      }

      // Get default invoice items
      const defaultItems = settings.default_invoice_items;

      if (!defaultItems || defaultItems.length === 0) {
        logger.warn(`⚠️ No default invoice items configured for club ${club_name}, skipping job #${jobId}`);
        await this.scheduledJobService.markJobFailed(
          jobId,
          'No default invoice items configured'
        );
        return;
      }

      // Get all active users for this season
      // Note: We need to get users who are part of this club/season
      const users = await this.getSeasonUsers(club_id, season_id);

      if (users.length === 0) {
        logger.info(`ℹ️ No users found for season ${season_name} in club ${club_name}`);
        await this.scheduledJobService.markJobCompleted(jobId, 0);
        return;
      }

      logger.info(`👥 Generating invoices for ${users.length} user(s)...`);

      // Calculate invoice dates
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Apply service charge to default items
      const itemsWithCharge = await this.billingSettingsService.applyServiceCharge(
        club_id,
        defaultItems
      );

      // Generate invoices for each user
      const result = await this.invoiceService.generateSeasonalInvoices(
        club_id,
        {
          season_id,
          user_ids: users.map(u => u.id),
          items: itemsWithCharge,
          issue_date: issueDate,
          due_date: dueDateStr,
          notes: `Automatically generated seasonal invoice for ${season_name}`
        },
        1 // System user ID (you may need to adjust this)
      );

      logger.info(`✅ Job #${jobId} completed: Generated ${result.count} invoice(s)`);

      // Send email notifications to parents for auto-generated invoices
      if (result.success && result.invoices && result.invoices.length > 0) {
        logger.info(`📧 Sending ${result.invoices.length} email notification(s)...`);

        try {
          // Get club data
          const club = await this.db('clubs').where('id', club_id).first();

          let emailsSent = 0;
          let emailsFailed = 0;

          for (const invoice of result.invoices) {
            // Only send emails for published invoices
            if (invoice.status === 'pending') {
              try {
                // Get parent data via user_children relationship
                const parent = await this.db('users')
                  .join('user_children', 'users.id', 'user_children.parent_id')
                  .where('user_children.child_id', invoice.user_id)
                  .select('users.*')
                  .first();

                if (parent && parent.email) {
                  // Get member data
                  const member = await this.db('users')
                    .where('id', invoice.user_id)
                    .first();

                  // Send email notification
                  await emailService.sendInvoiceNotification({
                    invoiceData: invoice,
                    parentData: parent,
                    memberData: member,
                    clubData: club
                  });

                  emailsSent++;
                  logger.info(`✉️ Email sent to ${parent.email} for invoice ${invoice.invoice_number}`);
                } else {
                  logger.warn(`⚠️ No parent email found for member ${invoice.user_id}, skipping notification`);
                }
              } catch (emailError) {
                emailsFailed++;
                logger.error(`❌ Failed to send email for invoice ${invoice.invoice_number}:`, emailError);
              }
            }
          }

          logger.info(`📧 Email notifications complete: ${emailsSent} sent, ${emailsFailed} failed`);
        } catch (emailError) {
          logger.error('❌ Error sending bulk email notifications:', emailError);
        }
      }

      // Mark job as completed
      await this.scheduledJobService.markJobCompleted(jobId, result.count);
    } catch (error) {
      logger.error(`❌ Error processing job #${jobId}:`, error);

      // Mark job as failed
      await this.scheduledJobService.markJobFailed(
        jobId,
        error.message || 'Unknown error occurred'
      );
    }
  }

  /**
   * Get all users for a specific season
   * This queries users who are associated with the club
   */
  async getSeasonUsers(clubId, seasonId) {
    try {
      // Get all users who are part of this club
      // This assumes users are linked to clubs through some relationship
      // Adjust the query based on your actual schema

      // Option 1: If users have club_id directly
      const users = await this.db('users')
        .select('users.id', 'users.email')
        .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
        .where('users.club_id', clubId)
        .whereNull('users.deleted_at');

      return users;

      // Option 2: If you need to filter by role or other criteria, adjust accordingly
      // For example, only billing users with specific roles:
      /*
      const users = await this.db('users')
        .select('users.id', 'users.email')
        .where('users.club_id', clubId)
        .whereRaw("users.roles::jsonb @> ?", [JSON.stringify(['member'])])
        .whereNull('users.deleted_at');

      return users;
      */
    } catch (error) {
      logger.error('Error fetching season users:', error);
      throw error;
    }
  }

  /**
   * Manual trigger for testing - processes pending jobs immediately
   */
  async triggerNow() {
    logger.info('🔔 Manually triggering invoice scheduler...');
    await this.processPendingJobs();
  }
}

/**
 * Initialize and start the invoice scheduler
 */
export function startInvoiceScheduler(db) {
  const scheduler = new InvoiceScheduler(db);
  scheduler.start();
  return scheduler;
}
