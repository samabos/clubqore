/**
 * Membership Tier Controller
 *
 * Handles HTTP requests for membership tier management.
 * Used by club managers to create and manage subscription tiers.
 */

import { MembershipTierService } from '../services/MembershipTierService.js';
import { ClubService } from '../../club/services/ClubService.js';

export class MembershipTierController {
  constructor(db) {
    this.db = db;
    this.tierService = new MembershipTierService(db);
    this.clubService = new ClubService(db);
  }

  /**
   * Get the club ID for the authenticated user
   *
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
   * Create a new membership tier
   *
   * POST /membership-tiers
   */
  async createTier(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const tierData = request.body;

      const tier = await this.tierService.createTier(clubId, tierData);

      return reply.code(201).send({
        success: true,
        data: tier
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
   * Get all membership tiers for the club
   *
   * GET /membership-tiers
   */
  async getTiers(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { activeOnly } = request.query;

      const tiers = await this.tierService.getTiersByClub(clubId, {
        activeOnly: activeOnly === 'true'
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

  /**
   * Get a single membership tier
   *
   * GET /membership-tiers/:tierId
   */
  async getTier(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { tierId } = request.params;

      const tier = await this.tierService.getTier(tierId, clubId);

      return reply.send({
        success: true,
        data: tier
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
   * Update a membership tier
   *
   * PUT /membership-tiers/:tierId
   */
  async updateTier(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { tierId } = request.params;
      const updateData = request.body;

      const tier = await this.tierService.updateTier(tierId, clubId, updateData);

      return reply.send({
        success: true,
        data: tier
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
   * Delete a membership tier
   *
   * DELETE /membership-tiers/:tierId
   */
  async deleteTier(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { tierId } = request.params;
      const { force } = request.query;

      const result = await this.tierService.deleteTier(tierId, clubId, force === 'true');

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
   * Reorder membership tiers
   *
   * PUT /membership-tiers/reorder
   */
  async reorderTiers(request, reply) {
    try {
      const clubId = await this._getClubId(request);
      const { tierIds } = request.body;

      if (!Array.isArray(tierIds) || tierIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'tierIds must be a non-empty array of tier IDs'
        });
      }

      const tiers = await this.tierService.reorderTiers(clubId, tierIds);

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

  /**
   * Get tier statistics
   *
   * GET /membership-tiers/stats
   */
  async getTierStats(request, reply) {
    try {
      const clubId = await this._getClubId(request);

      const stats = await this.tierService.getTierStats(clubId);

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

export default MembershipTierController;
