import { BillingSettingsService } from '../../billing/services/BillingSettingsService.js';
import { SubscriptionBillingService } from '../../payment/services/SubscriptionBillingService.js';
import { WorkerExecutionService } from '../../payment/services/WorkerExecutionService.js';

export class AdminBillingController {
  constructor(db) {
    this.db = db;
    this.billingSettingsService = new BillingSettingsService(db);
    this.subscriptionBillingService = new SubscriptionBillingService(db);
    this.workerExecutionService = new WorkerExecutionService(db);
  }

  /**
   * Verify user has super_admin role
   */
  async verifySuperAdmin(userId) {
    const userRole = await this.db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .where('roles.name', 'super_admin')
      .where('user_roles.is_active', true)
      .first();

    if (!userRole) {
      throw new Error('Access denied: Super admin role required');
    }
    return true;
  }

  /**
   * GET /admin/clubs - Get all clubs for dropdown
   */
  async getAllClubs(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const clubs = await this.db('clubs')
        .where('is_active', true)
        .select('id', 'name', 'club_type', 'verified', 'created_at')
        .orderBy('name', 'asc');

      reply.code(200).send({
        success: true,
        clubs
      });
    } catch (error) {
      request.log.error('Error fetching clubs:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch clubs'
      });
    }
  }

  /**
   * GET /admin/clubs/:clubId/billing/settings - Get billing settings for any club
   */
  async getClubBillingSettings(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;

      await this.verifySuperAdmin(userId);

      const settings = await this.billingSettingsService.adminGetSettings(clubId);

      reply.code(200).send({
        success: true,
        settings
      });
    } catch (error) {
      request.log.error('Error fetching billing settings:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch billing settings'
      });
    }
  }

  /**
   * PUT /admin/clubs/:clubId/billing/settings - Update billing settings for any club
   */
  async updateClubBillingSettings(request, reply) {
    try {
      const { clubId } = request.params;
      const settingsData = request.body;
      const userId = request.user.id;

      await this.verifySuperAdmin(userId);

      const result = await this.billingSettingsService.adminUpdateSettings(clubId, settingsData);

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating billing settings:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 400).send({
        success: false,
        message: error.message || 'Failed to update billing settings'
      });
    }
  }

  /**
   * GET /admin/billing/due-subscriptions - Get subscriptions due for billing
   */
  async getDueSubscriptions(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const dueSubscriptions = await this.subscriptionBillingService.getDueSubscriptions();

      reply.code(200).send({
        success: true,
        count: dueSubscriptions.length,
        subscriptions: dueSubscriptions.map(s => ({
          id: s.id,
          clubId: s.club_id,
          parentUserId: s.parent_user_id,
          childUserId: s.child_user_id,
          tierName: s.tier_name,
          amount: parseFloat(s.amount),
          billingFrequency: s.billing_frequency,
          nextBillingDate: s.next_billing_date,
          status: s.status
        }))
      });
    } catch (error) {
      request.log.error('Error fetching due subscriptions:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch due subscriptions'
      });
    }
  }

  /**
   * POST /admin/billing/trigger-billing - Manually trigger billing for due subscriptions
   */
  async triggerBilling(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const { subscriptionId } = request.body || {};

      // If specific subscription ID provided, bill just that one
      if (subscriptionId) {
        request.log.info(`Manual billing triggered for subscription ${subscriptionId}`);
        const result = await this.subscriptionBillingService.processBillingCycle(subscriptionId);

        return reply.code(200).send({
          success: true,
          message: `Billing processed for subscription ${subscriptionId}`,
          result: {
            subscriptionId: result.subscriptionId,
            invoiceId: result.invoice?.id,
            paymentStatus: result.payment?.status || result.payment?.error,
            nextBillingDate: result.nextBillingDate
          }
        });
      }

      // Otherwise, process all due subscriptions
      const dueSubscriptions = await this.subscriptionBillingService.getDueSubscriptions();

      if (dueSubscriptions.length === 0) {
        return reply.code(200).send({
          success: true,
          message: 'No subscriptions due for billing',
          processed: 0
        });
      }

      request.log.info(`Manual billing triggered for ${dueSubscriptions.length} subscriptions`);

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        details: []
      };

      for (const subscription of dueSubscriptions) {
        results.processed++;
        try {
          const result = await this.subscriptionBillingService.processBillingCycle(subscription.id);
          if (result.payment?.error) {
            results.failed++;
            results.details.push({
              subscriptionId: subscription.id,
              status: 'failed',
              error: result.payment.error
            });
          } else {
            results.successful++;
            results.details.push({
              subscriptionId: subscription.id,
              status: 'success',
              invoiceId: result.invoice?.id
            });
          }
        } catch (error) {
          results.failed++;
          results.details.push({
            subscriptionId: subscription.id,
            status: 'failed',
            error: error.message
          });
        }
      }

      reply.code(200).send({
        success: true,
        message: `Billing completed: ${results.successful} successful, ${results.failed} failed`,
        ...results
      });
    } catch (error) {
      request.log.error('Error triggering billing:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to trigger billing'
      });
    }
  }

  /**
   * GET /admin/billing/failed-payments - Get failed payments eligible for retry
   */
  async getFailedPayments(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const failedPayments = await this.subscriptionBillingService.getPaymentsForRetry();

      reply.code(200).send({
        success: true,
        count: failedPayments.length,
        payments: failedPayments
      });
    } catch (error) {
      request.log.error('Error fetching failed payments:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch failed payments'
      });
    }
  }

  /**
   * POST /admin/billing/retry-payment - Manually retry a failed payment
   */
  async retryPayment(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const { paymentId } = request.body;

      if (!paymentId) {
        return reply.code(400).send({
          success: false,
          message: 'paymentId is required'
        });
      }

      request.log.info(`Manual payment retry triggered for payment ${paymentId}`);
      const result = await this.subscriptionBillingService.retryPayment(paymentId);

      reply.code(200).send({
        success: true,
        message: `Payment retry initiated`,
        result
      });
    } catch (error) {
      request.log.error('Error retrying payment:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to retry payment'
      });
    }
  }

  /**
   * GET /admin/billing/workers/status - Get status of all billing workers
   */
  async getWorkersStatus(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const workers = await this.workerExecutionService.getLatestExecutions();

      reply.code(200).send({
        success: true,
        workers
      });
    } catch (error) {
      request.log.error('Error fetching workers status:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch workers status'
      });
    }
  }

  /**
   * GET /admin/billing/workers/:name/history - Get execution history for a worker
   */
  async getWorkerHistory(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const { name } = request.params;
      const { limit = 50 } = request.query;

      const history = await this.workerExecutionService.getExecutionHistory(name, parseInt(limit));

      reply.code(200).send({
        success: true,
        workerName: name,
        count: history.length,
        executions: history
      });
    } catch (error) {
      request.log.error('Error fetching worker history:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch worker history'
      });
    }
  }

  /**
   * GET /admin/billing/workers/history - Get execution history for all workers
   */
  async getAllWorkerHistory(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const { limit = 50 } = request.query;

      const history = await this.workerExecutionService.getExecutionHistory(null, parseInt(limit));

      reply.code(200).send({
        success: true,
        count: history.length,
        executions: history
      });
    } catch (error) {
      request.log.error('Error fetching all worker history:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch worker history'
      });
    }
  }

  /**
   * POST /admin/billing/workers/:name/trigger - Manually trigger a specific worker
   */
  async triggerWorker(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const { name } = request.params;

      // Check if worker is already running
      const isRunning = await this.workerExecutionService.isWorkerRunning(name);
      if (isRunning) {
        return reply.code(409).send({
          success: false,
          message: `Worker ${name} is already running`
        });
      }

      request.log.info(`Manual trigger requested for worker: ${name}`);

      // Import and run the appropriate worker
      let result;
      switch (name) {
        case 'subscription_billing': {
          const { SubscriptionBillingWorker } = await import('../../workers/subscription-billing-worker.js');
          const worker = new SubscriptionBillingWorker(this.db);
          result = await worker.triggerManually();
          break;
        }
        case 'payment_retry': {
          const { PaymentRetryWorker } = await import('../../workers/payment-retry-worker.js');
          const worker = new PaymentRetryWorker(this.db);
          result = await worker.triggerManually();
          break;
        }
        case 'invoice_scheduler': {
          const { InvoiceScheduler } = await import('../../workers/invoice-scheduler.js');
          const worker = new InvoiceScheduler(this.db);
          result = await worker.triggerNow();
          break;
        }
        case 'subscription_notification': {
          const { SubscriptionNotificationWorker } = await import('../../workers/subscription-notification-worker.js');
          const worker = new SubscriptionNotificationWorker(this.db);
          result = await worker.triggerManually();
          break;
        }
        default:
          return reply.code(400).send({
            success: false,
            message: `Unknown worker: ${name}`
          });
      }

      reply.code(200).send({
        success: true,
        message: `Worker ${name} triggered successfully`,
        result
      });
    } catch (error) {
      request.log.error('Error triggering worker:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to trigger worker'
      });
    }
  }
}
