/**
 * Parent Subscription Controller
 *
 * Handles HTTP requests for subscription management by parents.
 * Parents can view their subscriptions, change tiers, pause/resume, and cancel.
 */

import { SubscriptionService } from '../services/SubscriptionService.js';
import { MembershipTierService } from '../services/MembershipTierService.js';

export class ParentSubscriptionController {
  constructor(db) {
    this.db = db;
    this.subscriptionService = new SubscriptionService(db);
    this.tierService = new MembershipTierService(db);
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
   * Verify subscription belongs to the authenticated parent
   * @private
   */
  async _verifyOwnership(subscriptionId, parentUserId) {
    const subscription = await this.db('subscriptions')
      .where({ id: subscriptionId, parent_user_id: parentUserId })
      .first();

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    return subscription;
  }

  /**
   * Get all subscriptions for the authenticated parent
   *
   * GET /subscriptions
   */
  async getSubscriptions(request, reply) {
    try {
      const parentUserId = request.user.id;
      const filters = {
        status: request.query.status,
        clubId: request.query.clubId
      };

      const subscriptions = await this.subscriptionService.getSubscriptionsByParent(
        parentUserId,
        filters
      );

      return reply.send({
        success: true,
        data: subscriptions
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
      const parentUserId = request.user.id;
      const { subscriptionId } = request.params;

      // Verify ownership
      await this._verifyOwnership(subscriptionId, parentUserId);

      const subscription = await this.subscriptionService.getSubscription(subscriptionId);

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
   * Create a new subscription for a child
   *
   * POST /subscriptions
   */
  async createSubscription(request, reply) {
    try {
      const parentUserId = request.user.id;
      const {
        clubId,
        childUserId,
        membershipTierId,
        paymentMandateId,
        billingDayOfMonth,
        billingFrequency
      } = request.body;

      // Verify parent-child relationship
      const relationship = await this.db('user_children')
        .where({
          parent_user_id: parentUserId,
          child_user_id: childUserId,
          club_id: clubId
        })
        .first();

      // Allow self-subscription
      if (!relationship && parentUserId !== childUserId) {
        return reply.status(403).send({
          success: false,
          error: 'Not authorized to create subscription for this member'
        });
      }

      const subscription = await this.subscriptionService.createSubscription({
        clubId,
        parentUserId,
        childUserId,
        membershipTierId,
        paymentMandateId,
        billingDayOfMonth,
        billingFrequency
      }, this._getContext(request));

      return reply.code(201).send({
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
   * Change subscription tier
   *
   * PUT /subscriptions/:subscriptionId/tier
   */
  async changeTier(request, reply) {
    try {
      const parentUserId = request.user.id;
      const { subscriptionId } = request.params;
      const { newTierId, prorate } = request.body;

      // Verify ownership
      await this._verifyOwnership(subscriptionId, parentUserId);

      const result = await this.subscriptionService.changeTier(
        subscriptionId,
        newTierId,
        prorate !== false, // Default to true
        this._getContext(request)
      );

      return reply.send({
        success: true,
        data: result
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
   * Pause a subscription
   *
   * POST /subscriptions/:subscriptionId/pause
   */
  async pauseSubscription(request, reply) {
    try {
      const parentUserId = request.user.id;
      const { subscriptionId } = request.params;
      const { resumeDate } = request.body || {};

      // Verify ownership
      await this._verifyOwnership(subscriptionId, parentUserId);

      const subscription = await this.subscriptionService.pauseSubscription(
        subscriptionId,
        resumeDate ? new Date(resumeDate) : null,
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
   * Resume a paused subscription
   *
   * POST /subscriptions/:subscriptionId/resume
   */
  async resumeSubscription(request, reply) {
    try {
      const parentUserId = request.user.id;
      const { subscriptionId } = request.params;

      // Verify ownership
      await this._verifyOwnership(subscriptionId, parentUserId);

      const subscription = await this.subscriptionService.resumeSubscription(
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
   * Cancel a subscription
   *
   * POST /subscriptions/:subscriptionId/cancel
   */
  async cancelSubscription(request, reply) {
    try {
      const parentUserId = request.user.id;
      const { subscriptionId } = request.params;
      const { reason, immediate } = request.body || {};

      // Verify ownership
      await this._verifyOwnership(subscriptionId, parentUserId);

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
   * Get available membership tiers for a club
   *
   * GET /clubs/:clubId/membership-tiers
   */
  async getAvailableTiers(request, reply) {
    try {
      const { clubId } = request.params;

      const tiers = await this.tierService.getTiersByClub(clubId, {
        activeOnly: true
      });

      return reply.send({
        success: true,
        data: tiers
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

export default ParentSubscriptionController;
