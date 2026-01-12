/**
 * Subscription Service
 *
 * Handles subscription lifecycle management including creation, activation,
 * pausing, resuming, cancellation, tier changes, and suspension.
 */

import { MembershipTierService } from './MembershipTierService.js';

// Valid subscription status transitions
const STATUS_TRANSITIONS = {
  pending: ['active', 'cancelled'],
  active: ['paused', 'cancelled', 'suspended'],
  paused: ['active', 'cancelled'],
  cancelled: [], // Terminal state
  suspended: ['active', 'cancelled'] // Can be reactivated after payment
};

export class SubscriptionService {
  constructor(db) {
    this.db = db;
    this.tierService = new MembershipTierService(db);
  }

  /**
   * Create a new subscription
   *
   * @param {Object} data - Subscription data
   * @param {number} data.clubId - Club ID
   * @param {number} data.parentUserId - Parent user ID (who pays)
   * @param {number} data.childUserId - Child user ID (who subscription is for)
   * @param {number} data.membershipTierId - Membership tier ID
   * @param {number} data.paymentMandateId - Payment mandate ID (optional, can be added later)
   * @param {number} data.billingDayOfMonth - Day of month for billing (1-28)
   * @param {string} data.billingFrequency - 'monthly' or 'annual'
   * @param {Object} context - Request context for audit
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(data, context = {}) {
    return await this.db.transaction(async (trx) => {
      // Validate tier exists and is active
      const tier = await trx('membership_tiers')
        .where({ id: data.membershipTierId, club_id: data.clubId, is_active: true })
        .first();

      if (!tier) {
        const error = new Error('Membership tier not found or inactive');
        error.statusCode = 404;
        throw error;
      }

      // Check for existing active subscription for this child at this club
      const existing = await trx('subscriptions')
        .where({
          child_user_id: data.childUserId,
          club_id: data.clubId
        })
        .whereNotIn('status', ['cancelled'])
        .first();

      if (existing) {
        const error = new Error('An active subscription already exists for this member');
        error.statusCode = 409;
        throw error;
      }

      // Validate parent-child relationship
      const relationship = await trx('user_children')
        .where({
          parent_user_id: data.parentUserId,
          child_user_id: data.childUserId,
          club_id: data.clubId
        })
        .first();

      // Allow self-subscription (parent pays for themselves)
      if (!relationship && data.parentUserId !== data.childUserId) {
        const error = new Error('Invalid parent-child relationship');
        error.statusCode = 400;
        throw error;
      }

      // Determine billing frequency and amount
      const billingFrequency = data.billingFrequency || tier.billing_frequency || 'monthly';
      const amount = billingFrequency === 'annual' && tier.annual_price
        ? tier.annual_price
        : tier.monthly_price;

      // Calculate billing dates
      const now = new Date();
      const billingDay = data.billingDayOfMonth || 1;
      const currentPeriodStart = now;

      let currentPeriodEnd;
      if (billingFrequency === 'annual') {
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      // Calculate next billing date
      const nextBillingDate = this._calculateNextBillingDate(billingDay, billingFrequency, now);

      // Determine initial status
      const initialStatus = data.paymentMandateId ? 'active' : 'pending';

      const [subscription] = await trx('subscriptions')
        .insert({
          club_id: data.clubId,
          parent_user_id: data.parentUserId,
          child_user_id: data.childUserId,
          membership_tier_id: data.membershipTierId,
          payment_mandate_id: data.paymentMandateId || null,
          status: initialStatus,
          billing_frequency: billingFrequency,
          billing_day_of_month: billingDay,
          amount: amount,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          next_billing_date: nextBillingDate,
          failed_payment_count: 0,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Log subscription event
      await this._logEvent(trx, subscription.id, 'created', {
        newStatus: initialStatus,
        context
      });

      return this.formatSubscription(subscription, tier);
    });
  }

  /**
   * Get a subscription by ID
   *
   * @param {number} subscriptionId - Subscription ID
   * @param {number} clubId - Club ID (optional, for authorization)
   * @returns {Promise<Object>} Subscription with tier and user details
   */
  async getSubscription(subscriptionId, clubId = null) {
    const query = this.db('subscriptions as s')
      .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
      .join('users as parent', 's.parent_user_id', 'parent.id')
      .join('users as child', 's.child_user_id', 'child.id')
      .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
      .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
      .leftJoin('payment_mandates as pm', 's.payment_mandate_id', 'pm.id')
      .where('s.id', subscriptionId)
      .select(
        's.*',
        'mt.name as tier_name',
        'mt.monthly_price as tier_monthly_price',
        'mt.annual_price as tier_annual_price',
        'mt.features as tier_features',
        'parent.email as parent_email',
        'parent_profile.first_name as parent_first_name',
        'parent_profile.last_name as parent_last_name',
        'child.email as child_email',
        'child_profile.first_name as child_first_name',
        'child_profile.last_name as child_last_name',
        'pm.status as mandate_status',
        'pm.scheme as mandate_scheme'
      );

    if (clubId) {
      query.andWhere('s.club_id', clubId);
    }

    const subscription = await query.first();

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    return this.formatSubscriptionWithDetails(subscription);
  }

  /**
   * Get subscriptions for a parent
   *
   * @param {number} parentUserId - Parent user ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of subscriptions
   */
  async getSubscriptionsByParent(parentUserId, filters = {}) {
    const query = this.db('subscriptions as s')
      .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
      .join('users as child', 's.child_user_id', 'child.id')
      .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
      .leftJoin('clubs as c', 's.club_id', 'c.id')
      .where('s.parent_user_id', parentUserId)
      .select(
        's.*',
        'mt.name as tier_name',
        'mt.features as tier_features',
        'child.email as child_email',
        'child_profile.first_name as child_first_name',
        'child_profile.last_name as child_last_name',
        'c.name as club_name'
      )
      .orderBy('s.created_at', 'desc');

    if (filters.status) {
      query.where('s.status', filters.status);
    }

    if (filters.clubId) {
      query.andWhere('s.club_id', filters.clubId);
    }

    const subscriptions = await query;
    return subscriptions.map(s => this.formatSubscriptionWithDetails(s));
  }

  /**
   * Get subscriptions for a club
   *
   * @param {number} clubId - Club ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Subscriptions with pagination
   */
  async getSubscriptionsByClub(clubId, filters = {}) {
    const query = this.db('subscriptions as s')
      .join('membership_tiers as mt', 's.membership_tier_id', 'mt.id')
      .join('users as parent', 's.parent_user_id', 'parent.id')
      .join('users as child', 's.child_user_id', 'child.id')
      .leftJoin('user_profiles as parent_profile', 'parent.id', 'parent_profile.user_id')
      .leftJoin('user_profiles as child_profile', 'child.id', 'child_profile.user_id')
      .where('s.club_id', clubId)
      .select(
        's.*',
        'mt.name as tier_name',
        'parent.email as parent_email',
        'parent_profile.first_name as parent_first_name',
        'parent_profile.last_name as parent_last_name',
        'child.email as child_email',
        'child_profile.first_name as child_first_name',
        'child_profile.last_name as child_last_name'
      );

    // Apply filters
    if (filters.status) {
      query.where('s.status', filters.status);
    }

    if (filters.tierId) {
      query.where('s.membership_tier_id', filters.tierId);
    }

    if (filters.search) {
      const search = `%${filters.search}%`;
      query.where(function() {
        this.whereILike('parent.email', search)
          .orWhereILike('child.email', search)
          .orWhereILike('parent_profile.first_name', search)
          .orWhereILike('parent_profile.last_name', search)
          .orWhereILike('child_profile.first_name', search)
          .orWhereILike('child_profile.last_name', search);
      });
    }

    // Count total
    const countQuery = query.clone().clearSelect().count('s.id as total').first();

    // Apply sorting
    const sortField = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query.orderBy(`s.${sortField}`, sortOrder);

    // Apply pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query.limit(limit).offset(offset);

    const [subscriptions, countResult] = await Promise.all([
      query,
      countQuery
    ]);

    const total = parseInt(countResult.total);

    return {
      data: subscriptions.map(s => this.formatSubscriptionWithDetails(s)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Activate a pending subscription
   *
   * @param {number} subscriptionId - Subscription ID
   * @param {number} paymentMandateId - Payment mandate ID
   * @param {Object} context - Request context for audit
   * @returns {Promise<Object>} Activated subscription
   */
  async activateSubscription(subscriptionId, paymentMandateId, context = {}) {
    return await this.db.transaction(async (trx) => {
      const subscription = await trx('subscriptions')
        .where({ id: subscriptionId })
        .first();

      if (!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
      }

      this._validateStatusTransition(subscription.status, 'active');

      const [updated] = await trx('subscriptions')
        .where({ id: subscriptionId })
        .update({
          status: 'active',
          payment_mandate_id: paymentMandateId,
          updated_at: new Date()
        })
        .returning('*');

      await this._logEvent(trx, subscriptionId, 'activated', {
        previousStatus: subscription.status,
        newStatus: 'active',
        context
      });

      return this.formatSubscription(updated);
    });
  }

  /**
   * Pause a subscription
   *
   * @param {number} subscriptionId - Subscription ID
   * @param {Date} resumeDate - Optional date to auto-resume
   * @param {Object} context - Request context for audit
   * @returns {Promise<Object>} Paused subscription
   */
  async pauseSubscription(subscriptionId, resumeDate = null, context = {}) {
    return await this.db.transaction(async (trx) => {
      const subscription = await trx('subscriptions')
        .where({ id: subscriptionId })
        .first();

      if (!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
      }

      this._validateStatusTransition(subscription.status, 'paused');

      const [updated] = await trx('subscriptions')
        .where({ id: subscriptionId })
        .update({
          status: 'paused',
          paused_at: new Date(),
          resume_date: resumeDate,
          updated_at: new Date()
        })
        .returning('*');

      await this._logEvent(trx, subscriptionId, 'paused', {
        previousStatus: subscription.status,
        newStatus: 'paused',
        resumeDate,
        context
      });

      return this.formatSubscription(updated);
    });
  }

  /**
   * Resume a paused subscription
   *
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} context - Request context for audit
   * @returns {Promise<Object>} Resumed subscription
   */
  async resumeSubscription(subscriptionId, context = {}) {
    return await this.db.transaction(async (trx) => {
      const subscription = await trx('subscriptions')
        .where({ id: subscriptionId })
        .first();

      if (!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
      }

      this._validateStatusTransition(subscription.status, 'active');

      // Recalculate next billing date
      const nextBillingDate = this._calculateNextBillingDate(
        subscription.billing_day_of_month,
        subscription.billing_frequency,
        new Date()
      );

      const [updated] = await trx('subscriptions')
        .where({ id: subscriptionId })
        .update({
          status: 'active',
          paused_at: null,
          resume_date: null,
          next_billing_date: nextBillingDate,
          updated_at: new Date()
        })
        .returning('*');

      await this._logEvent(trx, subscriptionId, 'resumed', {
        previousStatus: subscription.status,
        newStatus: 'active',
        context
      });

      return this.formatSubscription(updated);
    });
  }

  /**
   * Cancel a subscription
   *
   * @param {number} subscriptionId - Subscription ID
   * @param {string} reason - Cancellation reason
   * @param {boolean} immediate - If true, cancel immediately; otherwise at end of period
   * @param {Object} context - Request context for audit
   * @returns {Promise<Object>} Cancelled subscription
   */
  async cancelSubscription(subscriptionId, reason = null, immediate = false, context = {}) {
    return await this.db.transaction(async (trx) => {
      const subscription = await trx('subscriptions')
        .where({ id: subscriptionId })
        .first();

      if (!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
      }

      this._validateStatusTransition(subscription.status, 'cancelled');

      const updateData = {
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: reason,
        updated_at: new Date()
      };

      // If not immediate, keep active until period end
      if (!immediate && subscription.status === 'active') {
        updateData.status = subscription.status;
        updateData.cancelled_at = subscription.current_period_end;
      }

      const [updated] = await trx('subscriptions')
        .where({ id: subscriptionId })
        .update(updateData)
        .returning('*');

      await this._logEvent(trx, subscriptionId, 'cancelled', {
        previousStatus: subscription.status,
        newStatus: updateData.status,
        reason,
        immediate,
        context
      });

      return this.formatSubscription(updated);
    });
  }

  /**
   * Suspend a subscription (after payment failures)
   *
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} context - Request context for audit
   * @returns {Promise<Object>} Suspended subscription
   */
  async suspendSubscription(subscriptionId, context = {}) {
    return await this.db.transaction(async (trx) => {
      const subscription = await trx('subscriptions')
        .where({ id: subscriptionId })
        .first();

      if (!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
      }

      this._validateStatusTransition(subscription.status, 'suspended');

      const [updated] = await trx('subscriptions')
        .where({ id: subscriptionId })
        .update({
          status: 'suspended',
          updated_at: new Date()
        })
        .returning('*');

      await this._logEvent(trx, subscriptionId, 'suspended', {
        previousStatus: subscription.status,
        newStatus: 'suspended',
        reason: 'Payment failure threshold exceeded',
        context
      });

      return this.formatSubscription(updated);
    });
  }

  /**
   * Change subscription tier
   *
   * @param {number} subscriptionId - Subscription ID
   * @param {number} newTierId - New tier ID
   * @param {boolean} prorate - Whether to prorate the change
   * @param {Object} context - Request context for audit
   * @returns {Promise<Object>} Updated subscription with proration details
   */
  async changeTier(subscriptionId, newTierId, prorate = true, context = {}) {
    return await this.db.transaction(async (trx) => {
      const subscription = await trx('subscriptions')
        .where({ id: subscriptionId })
        .first();

      if (!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
      }

      if (subscription.status !== 'active') {
        const error = new Error('Can only change tier on active subscriptions');
        error.statusCode = 400;
        throw error;
      }

      // Get new tier
      const newTier = await trx('membership_tiers')
        .where({ id: newTierId, club_id: subscription.club_id, is_active: true })
        .first();

      if (!newTier) {
        const error = new Error('New membership tier not found or inactive');
        error.statusCode = 404;
        throw error;
      }

      // Calculate new amount
      const newAmount = subscription.billing_frequency === 'annual' && newTier.annual_price
        ? newTier.annual_price
        : newTier.monthly_price;

      // Calculate proration if needed
      let prorationAmount = 0;
      if (prorate) {
        prorationAmount = this._calculateProration(subscription, newAmount);
      }

      const [updated] = await trx('subscriptions')
        .where({ id: subscriptionId })
        .update({
          membership_tier_id: newTierId,
          amount: newAmount,
          updated_at: new Date()
        })
        .returning('*');

      await this._logEvent(trx, subscriptionId, 'tier_changed', {
        previousTierId: subscription.membership_tier_id,
        newTierId: newTierId,
        previousAmount: subscription.amount,
        newAmount: newAmount,
        prorationAmount,
        context
      });

      return {
        subscription: this.formatSubscription(updated),
        proration: {
          amount: prorationAmount,
          credit: prorationAmount < 0 ? Math.abs(prorationAmount) : 0,
          charge: prorationAmount > 0 ? prorationAmount : 0
        }
      };
    });
  }

  /**
   * Record a failed payment
   *
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async recordFailedPayment(subscriptionId) {
    return await this.db.transaction(async (trx) => {
      const subscription = await trx('subscriptions')
        .where({ id: subscriptionId })
        .first();

      if (!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
      }

      const newFailedCount = (subscription.failed_payment_count || 0) + 1;

      const [updated] = await trx('subscriptions')
        .where({ id: subscriptionId })
        .update({
          failed_payment_count: newFailedCount,
          last_failed_payment_date: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      await this._logEvent(trx, subscriptionId, 'payment_failed', {
        failedPaymentCount: newFailedCount
      });

      return this.formatSubscription(updated);
    });
  }

  /**
   * Reset failed payment count (after successful payment)
   *
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async resetFailedPaymentCount(subscriptionId) {
    const [updated] = await this.db('subscriptions')
      .where({ id: subscriptionId })
      .update({
        failed_payment_count: 0,
        last_failed_payment_date: null,
        updated_at: new Date()
      })
      .returning('*');

    return this.formatSubscription(updated);
  }

  /**
   * Get subscription statistics for a club
   *
   * @param {number} clubId - Club ID
   * @returns {Promise<Object>} Subscription statistics
   */
  async getSubscriptionStats(clubId) {
    const stats = await this.db('subscriptions')
      .where({ club_id: clubId })
      .select(
        this.db.raw('COUNT(*) FILTER (WHERE status = \'active\') as active_count'),
        this.db.raw('COUNT(*) FILTER (WHERE status = \'pending\') as pending_count'),
        this.db.raw('COUNT(*) FILTER (WHERE status = \'paused\') as paused_count'),
        this.db.raw('COUNT(*) FILTER (WHERE status = \'cancelled\') as cancelled_count'),
        this.db.raw('COUNT(*) FILTER (WHERE status = \'suspended\') as suspended_count'),
        this.db.raw('COALESCE(SUM(amount) FILTER (WHERE status = \'active\'), 0) as monthly_recurring_revenue')
      )
      .first();

    return {
      activeCount: parseInt(stats.active_count),
      pendingCount: parseInt(stats.pending_count),
      pausedCount: parseInt(stats.paused_count),
      cancelledCount: parseInt(stats.cancelled_count),
      suspendedCount: parseInt(stats.suspended_count),
      totalActive: parseInt(stats.active_count) + parseInt(stats.pending_count),
      monthlyRecurringRevenue: parseFloat(stats.monthly_recurring_revenue)
    };
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Validate status transition
   * @private
   */
  _validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      const error = new Error(
        `Cannot transition from "${currentStatus}" to "${newStatus}"`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Calculate next billing date
   * @private
   */
  _calculateNextBillingDate(billingDay, billingFrequency, fromDate = new Date()) {
    const date = new Date(fromDate);

    if (billingFrequency === 'annual') {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }

    // Set to billing day, handling month length
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(billingDay, lastDayOfMonth));

    return date;
  }

  /**
   * Calculate proration amount
   * @private
   */
  _calculateProration(subscription, newAmount) {
    const now = new Date();
    const periodStart = new Date(subscription.current_period_start);
    const periodEnd = new Date(subscription.current_period_end);

    const totalDays = (periodEnd - periodStart) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, (periodEnd - now) / (1000 * 60 * 60 * 24));

    const currentDailyRate = parseFloat(subscription.amount) / totalDays;
    const newDailyRate = parseFloat(newAmount) / totalDays;

    const creditForUnused = currentDailyRate * daysRemaining;
    const chargeForNew = newDailyRate * daysRemaining;

    return Math.round((chargeForNew - creditForUnused) * 100) / 100;
  }

  /**
   * Log subscription event
   * @private
   */
  async _logEvent(trx, subscriptionId, eventType, data = {}) {
    await trx('subscription_events').insert({
      subscription_id: subscriptionId,
      event_type: eventType,
      previous_status: data.previousStatus || null,
      new_status: data.newStatus || null,
      previous_tier_id: data.previousTierId || null,
      new_tier_id: data.newTierId || null,
      description: data.description || null,
      actor_type: data.context?.actorType || 'system',
      actor_id: data.context?.actorId || null,
      ip_address: data.context?.ipAddress || null,
      user_agent: data.context?.userAgent || null,
      metadata: JSON.stringify({
        ...data,
        context: undefined
      }),
      created_at: new Date()
    });
  }

  /**
   * Format subscription from database row
   * @private
   */
  formatSubscription(subscription, tier = null) {
    return {
      id: subscription.id,
      clubId: subscription.club_id,
      parentUserId: subscription.parent_user_id,
      childUserId: subscription.child_user_id,
      membershipTierId: subscription.membership_tier_id,
      paymentMandateId: subscription.payment_mandate_id,
      status: subscription.status,
      billingFrequency: subscription.billing_frequency,
      billingDayOfMonth: subscription.billing_day_of_month,
      amount: parseFloat(subscription.amount),
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      nextBillingDate: subscription.next_billing_date,
      trialEndDate: subscription.trial_end_date,
      cancelledAt: subscription.cancelled_at,
      cancellationReason: subscription.cancellation_reason,
      pausedAt: subscription.paused_at,
      resumeDate: subscription.resume_date,
      failedPaymentCount: subscription.failed_payment_count,
      lastFailedPaymentDate: subscription.last_failed_payment_date,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
      tier: tier ? {
        id: tier.id,
        name: tier.name,
        monthlyPrice: parseFloat(tier.monthly_price),
        annualPrice: tier.annual_price ? parseFloat(tier.annual_price) : null
      } : null
    };
  }

  /**
   * Format subscription with user and tier details
   * @private
   */
  formatSubscriptionWithDetails(subscription) {
    return {
      ...this.formatSubscription(subscription),
      tier: {
        name: subscription.tier_name,
        monthlyPrice: subscription.tier_monthly_price ? parseFloat(subscription.tier_monthly_price) : null,
        annualPrice: subscription.tier_annual_price ? parseFloat(subscription.tier_annual_price) : null,
        features: subscription.tier_features ?
          (typeof subscription.tier_features === 'string'
            ? JSON.parse(subscription.tier_features)
            : subscription.tier_features)
          : []
      },
      parent: subscription.parent_email ? {
        email: subscription.parent_email,
        firstName: subscription.parent_first_name,
        lastName: subscription.parent_last_name
      } : null,
      child: subscription.child_email ? {
        email: subscription.child_email,
        firstName: subscription.child_first_name,
        lastName: subscription.child_last_name
      } : null,
      club: subscription.club_name ? {
        name: subscription.club_name
      } : null,
      mandate: subscription.mandate_status ? {
        status: subscription.mandate_status,
        scheme: subscription.mandate_scheme
      } : null
    };
  }
}

export default SubscriptionService;
