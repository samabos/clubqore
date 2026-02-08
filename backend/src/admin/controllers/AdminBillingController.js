import { WorkerExecutionService } from '../../payment/services/WorkerExecutionService.js';

/**
 * Admin Billing Controller
 *
 * Note: Billing settings, manual billing, and payment retry have been removed.
 * GoCardless now handles payment scheduling and retries natively via Subscriptions API.
 * This controller handles worker monitoring and admin invoice viewing.
 */
export class AdminBillingController {
  constructor(db) {
    this.db = db;
    this.workerExecutionService = new WorkerExecutionService(db);
  }

  /**
   * GET /admin/invoices - List all invoices across all clubs with pagination and filters
   */
  async getAllInvoices(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const {
        page = 1,
        limit = 20,
        status,
        clubId,
        search,
        fromDate,
        toDate
      } = request.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build query
      let query = this.db('invoices as i')
        .leftJoin('users as child', 'i.child_user_id', 'child.id')
        .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
        .leftJoin('users as parent', 'i.parent_user_id', 'parent.id')
        .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
        .leftJoin('clubs as c', 'i.club_id', 'c.id');

      // Apply filters
      if (status) {
        query = query.where('i.status', status);
      }

      if (clubId) {
        query = query.where('i.club_id', parseInt(clubId));
      }

      if (fromDate) {
        query = query.where('i.issue_date', '>=', fromDate);
      }

      if (toDate) {
        query = query.where('i.issue_date', '<=', toDate);
      }

      if (search) {
        query = query.where(function() {
          this.whereILike('i.invoice_number', `%${search}%`)
            .orWhereILike('child.email', `%${search}%`)
            .orWhereILike('parent.email', `%${search}%`)
            .orWhereILike('child_profile.first_name', `%${search}%`)
            .orWhereILike('child_profile.last_name', `%${search}%`)
            .orWhereILike('parent_profile.first_name', `%${search}%`)
            .orWhereILike('parent_profile.last_name', `%${search}%`)
            .orWhereILike('c.name', `%${search}%`);
        });
      }

      // Get total count
      const countQuery = query.clone();
      const [{ count: totalCount }] = await countQuery.count('i.id as count');

      // Get summary stats
      const statsQuery = this.db('invoices');
      if (status) statsQuery.where('status', status);
      if (clubId) statsQuery.where('club_id', parseInt(clubId));

      const stats = await this.db('invoices')
        .select(
          this.db.raw('COUNT(*) as total'),
          this.db.raw('SUM(CASE WHEN status = \'paid\' THEN 1 ELSE 0 END) as paid_count'),
          this.db.raw('SUM(CASE WHEN status = \'pending\' THEN 1 ELSE 0 END) as pending_count'),
          this.db.raw('SUM(CASE WHEN status = \'overdue\' THEN 1 ELSE 0 END) as overdue_count'),
          this.db.raw('SUM(CASE WHEN status = \'draft\' THEN 1 ELSE 0 END) as draft_count'),
          this.db.raw('SUM(CASE WHEN status = \'cancelled\' THEN 1 ELSE 0 END) as cancelled_count'),
          this.db.raw('COALESCE(SUM(total_amount), 0) as total_amount'),
          this.db.raw('COALESCE(SUM(amount_paid), 0) as total_paid'),
          this.db.raw('COALESCE(SUM(CASE WHEN status IN (\'pending\', \'overdue\') THEN total_amount - amount_paid ELSE 0 END), 0) as total_outstanding')
        )
        .first();

      // Get paginated results
      const invoices = await query
        .select(
          'i.id',
          'i.invoice_number',
          'i.status',
          'i.invoice_type',
          'i.issue_date',
          'i.due_date',
          'i.paid_date',
          'i.subtotal',
          'i.tax_amount',
          'i.discount_amount',
          'i.total_amount',
          'i.amount_paid',
          'i.notes',
          'i.created_at',
          'i.updated_at',
          'child.email as child_email',
          'child_profile.first_name as child_first_name',
          'child_profile.last_name as child_last_name',
          'parent.email as parent_email',
          'parent_profile.first_name as parent_first_name',
          'parent_profile.last_name as parent_last_name',
          'c.id as club_id',
          'c.name as club_name'
        )
        .orderBy('i.created_at', 'desc')
        .limit(parseInt(limit))
        .offset(offset);

      // Format response
      const formattedInvoices = invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        status: inv.status,
        invoiceType: inv.invoice_type,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        paidDate: inv.paid_date,
        subtotal: parseFloat(inv.subtotal) || 0,
        taxAmount: parseFloat(inv.tax_amount) || 0,
        discountAmount: parseFloat(inv.discount_amount) || 0,
        totalAmount: parseFloat(inv.total_amount) || 0,
        amountPaid: parseFloat(inv.amount_paid) || 0,
        notes: inv.notes,
        club: {
          id: inv.club_id,
          name: inv.club_name
        },
        child: {
          email: inv.child_email,
          name: [inv.child_first_name, inv.child_last_name].filter(Boolean).join(' ') || null
        },
        parent: {
          email: inv.parent_email,
          name: [inv.parent_first_name, inv.parent_last_name].filter(Boolean).join(' ') || null
        },
        createdAt: inv.created_at,
        updatedAt: inv.updated_at
      }));

      reply.code(200).send({
        success: true,
        invoices: formattedInvoices,
        summary: {
          total: parseInt(stats.total) || 0,
          paidCount: parseInt(stats.paid_count) || 0,
          pendingCount: parseInt(stats.pending_count) || 0,
          overdueCount: parseInt(stats.overdue_count) || 0,
          draftCount: parseInt(stats.draft_count) || 0,
          cancelledCount: parseInt(stats.cancelled_count) || 0,
          totalAmount: parseFloat(stats.total_amount) || 0,
          totalPaid: parseFloat(stats.total_paid) || 0,
          totalOutstanding: parseFloat(stats.total_outstanding) || 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount),
          totalPages: Math.ceil(parseInt(totalCount) / parseInt(limit))
        }
      });
    } catch (error) {
      request.log.error('Error fetching all invoices:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch invoices'
      });
    }
  }

  /**
   * GET /admin/invoices/:invoiceId - Get invoice details
   */
  async getInvoiceDetails(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const { invoiceId } = request.params;

      const invoice = await this.db('invoices as i')
        .leftJoin('users as child', 'i.child_user_id', 'child.id')
        .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
        .leftJoin('users as parent', 'i.parent_user_id', 'parent.id')
        .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
        .leftJoin('clubs as c', 'i.club_id', 'c.id')
        .leftJoin('seasons as s', 'i.season_id', 's.id')
        .select(
          'i.*',
          'child.email as child_email',
          'child_profile.first_name as child_first_name',
          'child_profile.last_name as child_last_name',
          'parent.email as parent_email',
          'parent_profile.first_name as parent_first_name',
          'parent_profile.last_name as parent_last_name',
          'c.id as club_id',
          'c.name as club_name',
          's.name as season_name'
        )
        .where('i.id', invoiceId)
        .first();

      if (!invoice) {
        return reply.code(404).send({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Get invoice items
      const items = await this.db('invoice_items')
        .where('invoice_id', invoiceId)
        .orderBy('id', 'asc');

      // Get payments
      const payments = await this.db('payments')
        .where('invoice_id', invoiceId)
        .orderBy('payment_date', 'desc');

      reply.code(200).send({
        success: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          status: invoice.status,
          invoiceType: invoice.invoice_type,
          issueDate: invoice.issue_date,
          dueDate: invoice.due_date,
          paidDate: invoice.paid_date,
          subtotal: parseFloat(invoice.subtotal) || 0,
          taxAmount: parseFloat(invoice.tax_amount) || 0,
          discountAmount: parseFloat(invoice.discount_amount) || 0,
          totalAmount: parseFloat(invoice.total_amount) || 0,
          amountPaid: parseFloat(invoice.amount_paid) || 0,
          notes: invoice.notes,
          seasonName: invoice.season_name,
          club: {
            id: invoice.club_id,
            name: invoice.club_name
          },
          child: {
            id: invoice.child_user_id,
            email: invoice.child_email,
            name: [invoice.child_first_name, invoice.child_last_name].filter(Boolean).join(' ') || null
          },
          parent: {
            id: invoice.parent_user_id,
            email: invoice.parent_email,
            name: [invoice.parent_first_name, invoice.parent_last_name].filter(Boolean).join(' ') || null
          },
          items: items.map(item => ({
            id: item.id,
            description: item.description,
            category: item.category,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unit_price) || 0,
            totalPrice: parseFloat(item.total_price) || 0
          })),
          payments: payments.map(p => ({
            id: p.id,
            amount: parseFloat(p.amount) || 0,
            paymentMethod: p.payment_method,
            paymentDate: p.payment_date,
            referenceNumber: p.reference_number,
            notes: p.notes
          })),
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at
        }
      });
    } catch (error) {
      request.log.error('Error fetching invoice details:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch invoice details'
      });
    }
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
   * GET /admin/billing/subscriptions/diagnostic - Debug subscription sync issues
   */
  async getSubscriptionDiagnostic(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      // Get all subscriptions with their direct mandate AND parent's mandate
      const subscriptions = await this.db('subscriptions as s')
        .leftJoin('payment_mandates as pm', 's.payment_mandate_id', 'pm.id')
        .leftJoin('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
        .leftJoin('users as child', 's.child_user_id', 'child.id')
        .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
        .leftJoin('users as parent', 's.parent_user_id', 'parent.id')
        .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
        .leftJoin('clubs as c', 's.club_id', 'c.id')
        // Also look for parent's mandate via payment_customer
        .leftJoin('payment_customers as pc', function() {
          this.on('pc.user_id', '=', 's.parent_user_id')
            .andOn('pc.club_id', '=', 's.club_id');
        })
        .leftJoin('payment_mandates as parent_pm', 'parent_pm.payment_customer_id', 'pc.id')
        .select(
          's.id',
          's.status as subscription_status',
          's.parent_user_id',
          's.child_user_id',
          's.payment_mandate_id',
          's.provider_subscription_id',
          's.amount',
          's.billing_frequency',
          's.created_at',
          // Direct mandate info
          'pm.id as direct_mandate_id',
          'pm.status as direct_mandate_status',
          'pm.provider as direct_provider',
          'pm.provider_mandate_id as direct_provider_mandate_id',
          // Parent's mandate info (may be different or same)
          'parent_pm.id as parent_mandate_id',
          'parent_pm.status as parent_mandate_status',
          'parent_pm.provider as parent_provider',
          'parent_pm.provider_mandate_id as parent_provider_mandate_id',
          'mt.name as tier_name',
          // Child details
          'child.email as child_email',
          'child_profile.first_name as child_first_name',
          'child_profile.last_name as child_last_name',
          // Parent details
          'parent.email as parent_email',
          'parent_profile.first_name as parent_first_name',
          'parent_profile.last_name as parent_last_name',
          'c.name as club_name'
        )
        .orderBy('s.created_at', 'desc')
        .limit(50);

      // Analyze each subscription for sync eligibility
      // Only include subscriptions that are NOT already synced (those need attention)
      const analyzed = subscriptions
        .filter(sub => !sub.provider_subscription_id) // Exclude already synced
        .map(sub => {
        const issues = [];

        // Check subscription status
        if (!['active', 'pending'].includes(sub.subscription_status)) {
          issues.push(`Status is '${sub.subscription_status}' (needs 'active' or 'pending')`);
        }

        // Check for usable mandate (either direct or parent's)
        const hasDirectActiveMandate = sub.direct_mandate_status === 'active' && sub.direct_provider_mandate_id;
        const hasParentActiveMandate = sub.parent_mandate_status === 'active' && sub.parent_provider_mandate_id;

        if (!hasDirectActiveMandate && !hasParentActiveMandate) {
          if (!sub.payment_mandate_id && !sub.parent_mandate_id) {
            issues.push('No mandate found (parent has no mandate for this club)');
          } else if (sub.direct_mandate_status && sub.direct_mandate_status !== 'active') {
            issues.push(`Direct mandate status is '${sub.direct_mandate_status}' (needs 'active')`);
          } else if (sub.parent_mandate_status && sub.parent_mandate_status !== 'active') {
            issues.push(`Parent mandate status is '${sub.parent_mandate_status}' (needs 'active')`);
          } else {
            issues.push('Mandate has no provider_mandate_id');
          }
        }

        // Determine the mandate that would be used for sync
        const usableMandate = hasDirectActiveMandate
          ? { id: sub.direct_mandate_id, status: sub.direct_mandate_status, provider: sub.direct_provider, providerMandateId: sub.direct_provider_mandate_id }
          : hasParentActiveMandate
            ? { id: sub.parent_mandate_id, status: sub.parent_mandate_status, provider: sub.parent_provider, providerMandateId: sub.parent_provider_mandate_id }
            : null;

        // Build display names
        const childName = [sub.child_first_name, sub.child_last_name].filter(Boolean).join(' ') || null;
        const parentName = [sub.parent_first_name, sub.parent_last_name].filter(Boolean).join(' ') || null;

        return {
          id: sub.id,
          club: sub.club_name,
          tier: sub.tier_name,
          // Child details
          childUserId: sub.child_user_id,
          childEmail: sub.child_email,
          childName,
          // Parent details
          parentUserId: sub.parent_user_id,
          parentEmail: sub.parent_email,
          parentName,
          amount: sub.amount,
          billingFrequency: sub.billing_frequency,
          subscriptionStatus: sub.subscription_status,
          paymentMandateId: sub.payment_mandate_id,
          providerSubscriptionId: sub.provider_subscription_id,
          // Show both direct and parent mandate info
          directMandateStatus: sub.direct_mandate_status,
          parentMandateId: sub.parent_mandate_id,
          parentMandateStatus: sub.parent_mandate_status,
          // The mandate that will be used
          mandateStatus: usableMandate?.status || null,
          providerMandateId: usableMandate?.providerMandateId || null,
          provider: usableMandate?.provider || null,
          createdAt: sub.created_at,
          needsSync: issues.length === 0,
          syncBlockers: issues
        };
      });

      const needsSync = analyzed.filter(s => s.needsSync);
      const blocked = analyzed.filter(s => !s.needsSync);

      reply.code(200).send({
        success: true,
        summary: {
          total: analyzed.length,
          needsSync: needsSync.length,
          blocked: blocked.length
        },
        subscriptionsNeedingSync: needsSync,
        blockedSubscriptions: blocked
      });
    } catch (error) {
      request.log.error('Error fetching subscription diagnostic:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch subscription diagnostic'
      });
    }
  }

  /**
   * GET /admin/billing/subscriptions - List all subscriptions with pagination and filters
   */
  async getAllSubscriptions(request, reply) {
    try {
      const userId = request.user.id;
      await this.verifySuperAdmin(userId);

      const {
        page = 1,
        limit = 20,
        status,
        clubId,
        search,
        hasProviderSubscription,
        fromDate,
        toDate
      } = request.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build query
      let query = this.db('subscriptions as s')
        .leftJoin('payment_mandates as pm', 's.payment_mandate_id', 'pm.id')
        .leftJoin('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
        .leftJoin('users as child', 's.child_user_id', 'child.id')
        .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
        .leftJoin('users as parent', 's.parent_user_id', 'parent.id')
        .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
        .leftJoin('clubs as c', 's.club_id', 'c.id');

      // Apply filters
      if (status) {
        query = query.where('s.status', status);
      }

      if (clubId) {
        query = query.where('s.club_id', parseInt(clubId));
      }

      if (hasProviderSubscription === 'true') {
        query = query.whereNotNull('s.provider_subscription_id');
      } else if (hasProviderSubscription === 'false') {
        query = query.whereNull('s.provider_subscription_id');
      }

      if (fromDate) {
        query = query.where('s.created_at', '>=', fromDate);
      }

      if (toDate) {
        query = query.where('s.created_at', '<=', toDate);
      }

      if (search) {
        query = query.where(function() {
          this.whereILike('child.email', `%${search}%`)
            .orWhereILike('parent.email', `%${search}%`)
            .orWhereILike('child_profile.first_name', `%${search}%`)
            .orWhereILike('child_profile.last_name', `%${search}%`)
            .orWhereILike('parent_profile.first_name', `%${search}%`)
            .orWhereILike('parent_profile.last_name', `%${search}%`)
            .orWhereILike('c.name', `%${search}%`)
            .orWhereILike('mt.name', `%${search}%`);
        });
      }

      // Get total count
      const countQuery = query.clone();
      const [{ count: totalCount }] = await countQuery.count('s.id as count');

      // Get paginated results
      const subscriptions = await query
        .select(
          's.id',
          's.status',
          's.amount',
          's.billing_frequency',
          's.billing_day_of_month',
          's.provider',
          's.provider_subscription_id',
          's.provider_subscription_status',
          's.payment_mandate_id',
          's.created_at',
          's.updated_at',
          'pm.status as mandate_status',
          'pm.provider_mandate_id',
          'mt.name as tier_name',
          'child.email as child_email',
          'child_profile.first_name as child_first_name',
          'child_profile.last_name as child_last_name',
          'parent.email as parent_email',
          'parent_profile.first_name as parent_first_name',
          'parent_profile.last_name as parent_last_name',
          'c.id as club_id',
          'c.name as club_name'
        )
        .orderBy('s.created_at', 'desc')
        .limit(parseInt(limit))
        .offset(offset);

      // Format response
      const formattedSubscriptions = subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        amount: sub.amount,
        billingFrequency: sub.billing_frequency,
        billingDayOfMonth: sub.billing_day_of_month,
        provider: sub.provider,
        providerSubscriptionId: sub.provider_subscription_id,
        providerSubscriptionStatus: sub.provider_subscription_status,
        mandateStatus: sub.mandate_status,
        providerMandateId: sub.provider_mandate_id,
        tier: sub.tier_name,
        club: {
          id: sub.club_id,
          name: sub.club_name
        },
        child: {
          email: sub.child_email,
          name: [sub.child_first_name, sub.child_last_name].filter(Boolean).join(' ') || null
        },
        parent: {
          email: sub.parent_email,
          name: [sub.parent_first_name, sub.parent_last_name].filter(Boolean).join(' ') || null
        },
        createdAt: sub.created_at,
        updatedAt: sub.updated_at
      }));

      reply.code(200).send({
        success: true,
        subscriptions: formattedSubscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount),
          totalPages: Math.ceil(parseInt(totalCount) / parseInt(limit))
        }
      });
    } catch (error) {
      request.log.error('Error fetching all subscriptions:', error);
      reply.code(error.message.includes('Access denied') ? 403 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch subscriptions'
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
        case 'subscription_sync': {
          const { SubscriptionSyncWorker } = await import('../../workers/subscription-sync-worker.js');
          const worker = new SubscriptionSyncWorker(this.db);
          result = await worker.runNow();
          break;
        }
        case 'notification_retry': {
          const { NotificationRetryWorker } = await import('../../workers/notification-retry-worker.js');
          const worker = new NotificationRetryWorker(this.db);
          result = await worker.triggerManually();
          break;
        }
        default:
          return reply.code(400).send({
            success: false,
            message: `Unknown worker: ${name}. Available workers: subscription_sync, notification_retry`
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
