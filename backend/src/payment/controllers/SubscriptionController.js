/**
 * Subscription Controller (Club Manager)
 *
 * Handles HTTP requests for subscription management by club managers.
 * Club managers can view, cancel, and manage subscriptions.
 */

import { SubscriptionService } from '../services/SubscriptionService.js';
import { ClubService } from '../../club/services/ClubService.js';

export class SubscriptionController {
  constructor(db) {
    this.db = db;
    this.subscriptionService = new SubscriptionService(db);
    this.clubService = new ClubService(db);
  }

  /**
   * Get the club ID for the authenticated user
   * @private
   */
  async _getClubId(request) {
    const userId = request.user.id;
    const clubId = await this.clubService.getManagersClubId(userId);

    if (!clubId) {
      const error = new Error('No club found for this user');
      error.statusCode = 404;
      throw error;
    }

    return clubId;
  }

  /**
   * Get request context for audit logging
   * @private
   */
  _getContext(request) {
    return {
      actorType: 'user',
      actorId: request.user.id,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    };
  }

  /**
   * Get all subscriptions for the club
   *
   * GET /subscriptions
   */
  async getSubscriptions(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const filters = {
        status: request.query.status,
        tierId: request.query.tierId,
        search: request.query.search,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
        page: request.query.page,
        limit: request.query.limit
      };

      const result = await this.subscriptionService.getSubscriptionsByClub(clubId, filters);

      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get a single subscription
   *
   * GET /subscriptions/:subscriptionId
   */
  async getSubscription(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { subscriptionId } = request.params;

      const subscription = await this.subscriptionService.getSubscription(subscriptionId, clubId);

      return reply.send({
        success: true,
        data: subscription
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create a subscription for a member (club manager action)
   *
   * POST /subscriptions
   */
  async createSubscription(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const {
        parentUserId,
        childUserId,
        membershipTierId,
        billingFrequency,
        billingDayOfMonth,
        startDate
      } = request.body;

      // Verify the tier belongs to this club
      const tier = await this.db('membership_tiers')
        .where({ id: membershipTierId, club_id: clubId })
        .first();

      if (!tier) {
        return reply.status(404).send({
          success: false,
          error: 'Membership tier not found'
        });
      }

      // Calculate amount based on frequency
      const frequency = billingFrequency || tier.billing_frequency;
      const amount = frequency === 'annual'
        ? (tier.annual_price || tier.monthly_price * 12)
        : tier.monthly_price;

      // Create the subscription
      const subscription = await this.subscriptionService.createSubscription({
        clubId,
        parentUserId,
        childUserId,
        membershipTierId,
        billingFrequency: frequency,
        billingDayOfMonth: billingDayOfMonth || new Date().getDate(),
        amount,
        startDate: startDate || new Date().toISOString(),
        status: 'pending' // Will be activated when payment is set up
      }, this._getContext(request));

      return reply.status(201).send({
        success: true,
        data: subscription
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get members available for subscription (not yet subscribed)
   *
   * GET /subscriptions/available-members
   */
  async getAvailableMembers(request, reply) {
    try {
      const clubId = await this._getClubId(request);

      // Get all child users linked to this club who don't have an active subscription
      const members = await this.db('users as u')
        .join('user_profiles as up', 'u.id', 'up.user_id')
        .join('user_roles as ur', 'u.id', 'ur.user_id')
        .join('roles as r', 'ur.role_id', 'r.id')
        .leftJoin('subscriptions as s', function() {
          this.on('u.id', '=', 's.child_user_id')
            .andOn('s.club_id', '=', clubId)
            .andOnIn('s.status', ['active', 'pending', 'paused']);
        })
        .where('r.name', 'member')
        .whereNull('s.id') // No active subscription
        .select(
          'u.id',
          'u.email',
          'up.first_name',
          'up.last_name'
        )
        .orderBy('up.last_name', 'asc');

      return reply.send({
        success: true,
        data: members
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cancel a subscription (club manager action)
   *
   * POST /subscriptions/:subscriptionId/cancel
   */
  async cancelSubscription(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { subscriptionId } = request.params;
      const { reason, immediate } = request.body || {};

      // Verify subscription belongs to club
      await this.subscriptionService.getSubscription(subscriptionId, clubId);

      const subscription = await this.subscriptionService.cancelSubscription(
        subscriptionId,
        reason,
        immediate === true,
        this._getContext(request)
      );

      return reply.send({
        success: true,
        data: subscription
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Suspend a subscription (club manager action)
   *
   * POST /subscriptions/:subscriptionId/suspend
   */
  async suspendSubscription(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { subscriptionId } = request.params;

      // Verify subscription belongs to club
      await this.subscriptionService.getSubscription(subscriptionId, clubId);

      const subscription = await this.subscriptionService.suspendSubscription(
        subscriptionId,
        this._getContext(request)
      );

      return reply.send({
        success: true,
        data: subscription
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Reactivate a suspended subscription
   *
   * POST /subscriptions/:subscriptionId/reactivate
   */
  async reactivateSubscription(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { subscriptionId } = request.params;

      // Verify subscription belongs to club
      const existing = await this.subscriptionService.getSubscription(subscriptionId, clubId);

      if (existing.status !== 'suspended') {
        return reply.status(400).send({
          success: false,
          error: 'Only suspended subscriptions can be reactivated'
        });
      }

      const subscription = await this.subscriptionService.resumeSubscription(
        subscriptionId,
        this._getContext(request)
      );

      // Reset failed payment count
      await this.subscriptionService.resetFailedPaymentCount(subscriptionId);

      return reply.send({
        success: true,
        data: subscription
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get subscription statistics
   *
   * GET /subscriptions/stats
   */
  async getStats(request, reply) {
    try {
      const clubId = await this._getClubId(request);

      const stats = await this.subscriptionService.getSubscriptionStats(clubId);

      return reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  }
}

export default SubscriptionController;
