/**
 * Membership Tier Service
 *
 * Handles CRUD operations for club membership tiers.
 * Clubs can define custom subscription tiers with different pricing and features.
 */

export class MembershipTierService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new membership tier for a club
   *
   * @param {number} clubId - The club ID
   * @param {Object} tierData - Tier data
   * @param {string} tierData.name - Tier name (e.g., "Bronze", "Silver", "Gold")
   * @param {string} tierData.description - Tier description
   * @param {number} tierData.monthlyPrice - Monthly price
   * @param {number} tierData.annualPrice - Annual price (optional)
   * @param {string} tierData.billingFrequency - 'monthly' or 'annual' (default: 'monthly')
   * @param {Array} tierData.features - Array of feature strings
   * @returns {Promise<Object>} Created tier
   */
  async createTier(clubId, tierData) {
    // Check for duplicate name
    const existing = await this.db('membership_tiers')
      .where({ club_id: clubId, name: tierData.name })
      .first();

    if (existing) {
      const error = new Error(`A tier named "${tierData.name}" already exists for this club`);
      error.statusCode = 409;
      throw error;
    }

    // Get the next sort order
    const maxOrder = await this.db('membership_tiers')
      .where({ club_id: clubId })
      .max('sort_order as max')
      .first();

    const sortOrder = (maxOrder?.max || 0) + 1;

    const [tier] = await this.db('membership_tiers')
      .insert({
        club_id: clubId,
        name: tierData.name,
        description: tierData.description || null,
        monthly_price: tierData.monthlyPrice,
        annual_price: tierData.annualPrice || null,
        billing_frequency: tierData.billingFrequency || 'monthly',
        features: tierData.features ? JSON.stringify(tierData.features) : null,
        is_active: tierData.isActive !== false,
        sort_order: sortOrder,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return this.formatTier(tier);
  }

  /**
   * Get a membership tier by ID
   *
   * @param {number} tierId - The tier ID
   * @param {number} clubId - The club ID (for authorization)
   * @returns {Promise<Object>} Tier data
   */
  async getTier(tierId, clubId = null) {
    const query = this.db('membership_tiers').where({ id: tierId });

    if (clubId) {
      query.andWhere({ club_id: clubId });
    }

    const tier = await query.first();

    if (!tier) {
      const error = new Error('Membership tier not found');
      error.statusCode = 404;
      throw error;
    }

    return this.formatTier(tier);
  }

  /**
   * Get all membership tiers for a club
   *
   * @param {number} clubId - The club ID
   * @param {Object} filters - Optional filters
   * @param {boolean} filters.activeOnly - Only return active tiers (default: false)
   * @returns {Promise<Array>} List of tiers
   */
  async getTiersByClub(clubId, filters = {}) {
    const query = this.db('membership_tiers')
      .where({ club_id: clubId })
      .orderBy('sort_order', 'asc');

    if (filters.activeOnly) {
      query.andWhere({ is_active: true });
    }

    const tiers = await query;

    return tiers.map(tier => this.formatTier(tier));
  }

  /**
   * Update a membership tier
   *
   * @param {number} tierId - The tier ID
   * @param {number} clubId - The club ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated tier
   */
  async updateTier(tierId, clubId, updateData) {
    // Verify tier exists and belongs to club
    const existing = await this.db('membership_tiers')
      .where({ id: tierId, club_id: clubId })
      .first();

    if (!existing) {
      const error = new Error('Membership tier not found');
      error.statusCode = 404;
      throw error;
    }

    // Check for duplicate name if name is being changed
    if (updateData.name && updateData.name !== existing.name) {
      const duplicate = await this.db('membership_tiers')
        .where({ club_id: clubId, name: updateData.name })
        .whereNot({ id: tierId })
        .first();

      if (duplicate) {
        const error = new Error(`A tier named "${updateData.name}" already exists for this club`);
        error.statusCode = 409;
        throw error;
      }
    }

    const updatePayload = {
      updated_at: new Date()
    };

    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.monthlyPrice !== undefined) updatePayload.monthly_price = updateData.monthlyPrice;
    if (updateData.annualPrice !== undefined) updatePayload.annual_price = updateData.annualPrice;
    if (updateData.billingFrequency !== undefined) updatePayload.billing_frequency = updateData.billingFrequency;
    if (updateData.features !== undefined) updatePayload.features = JSON.stringify(updateData.features);
    if (updateData.isActive !== undefined) updatePayload.is_active = updateData.isActive;

    const [tier] = await this.db('membership_tiers')
      .where({ id: tierId, club_id: clubId })
      .update(updatePayload)
      .returning('*');

    return this.formatTier(tier);
  }

  /**
   * Delete (soft delete by deactivating) a membership tier
   *
   * @param {number} tierId - The tier ID
   * @param {number} clubId - The club ID (for authorization)
   * @param {boolean} force - If true, hard delete (only if no subscriptions)
   * @returns {Promise<Object>} Deleted tier
   */
  async deleteTier(tierId, clubId, force = false) {
    // Verify tier exists and belongs to club
    const existing = await this.db('membership_tiers')
      .where({ id: tierId, club_id: clubId })
      .first();

    if (!existing) {
      const error = new Error('Membership tier not found');
      error.statusCode = 404;
      throw error;
    }

    // Check for active subscriptions using this tier
    const activeSubscriptions = await this.db('subscriptions')
      .where({ membership_tier_id: tierId })
      .whereNotIn('status', ['cancelled', 'suspended'])
      .count('id as count')
      .first();

    if (parseInt(activeSubscriptions.count) > 0) {
      if (force) {
        const error = new Error(
          `Cannot delete tier with ${activeSubscriptions.count} active subscription(s). ` +
          'Please cancel or migrate subscriptions first.'
        );
        error.statusCode = 400;
        throw error;
      }

      // Soft delete by deactivating
      const [tier] = await this.db('membership_tiers')
        .where({ id: tierId, club_id: clubId })
        .update({
          is_active: false,
          updated_at: new Date()
        })
        .returning('*');

      return {
        ...this.formatTier(tier),
        deleted: false,
        deactivated: true
      };
    }

    // Hard delete if no active subscriptions
    await this.db('membership_tiers')
      .where({ id: tierId, club_id: clubId })
      .delete();

    return {
      ...this.formatTier(existing),
      deleted: true,
      deactivated: false
    };
  }

  /**
   * Reorder membership tiers
   *
   * @param {number} clubId - The club ID
   * @param {Array<number>} tierIds - Array of tier IDs in desired order
   * @returns {Promise<Array>} Updated tiers in new order
   */
  async reorderTiers(clubId, tierIds) {
    // Verify all tiers belong to the club
    const tiers = await this.db('membership_tiers')
      .where({ club_id: clubId })
      .whereIn('id', tierIds);

    if (tiers.length !== tierIds.length) {
      const error = new Error('One or more tier IDs are invalid');
      error.statusCode = 400;
      throw error;
    }

    // Update sort order within a transaction
    await this.db.transaction(async (trx) => {
      for (let i = 0; i < tierIds.length; i++) {
        await trx('membership_tiers')
          .where({ id: tierIds[i], club_id: clubId })
          .update({
            sort_order: i + 1,
            updated_at: new Date()
          });
      }
    });

    return this.getTiersByClub(clubId);
  }

  /**
   * Get subscription count by tier
   *
   * @param {number} clubId - The club ID
   * @returns {Promise<Array>} Tier stats
   */
  async getTierStats(clubId) {
    const stats = await this.db('membership_tiers as mt')
      .leftJoin('subscriptions as s', function() {
        this.on('mt.id', '=', 's.membership_tier_id')
          .andOnVal('s.status', '=', 'active');
      })
      .where('mt.club_id', clubId)
      .groupBy('mt.id', 'mt.name', 'mt.monthly_price', 'mt.annual_price', 'mt.is_active', 'mt.sort_order')
      .select(
        'mt.id',
        'mt.name',
        'mt.monthly_price',
        'mt.annual_price',
        'mt.is_active',
        'mt.sort_order',
        this.db.raw('COUNT(s.id) as subscription_count'),
        this.db.raw('COALESCE(SUM(s.amount), 0) as monthly_revenue')
      )
      .orderBy('mt.sort_order', 'asc');

    return stats.map(stat => ({
      id: stat.id,
      name: stat.name,
      monthlyPrice: parseFloat(stat.monthly_price),
      annualPrice: stat.annual_price ? parseFloat(stat.annual_price) : null,
      isActive: stat.is_active,
      sortOrder: stat.sort_order,
      subscriptionCount: parseInt(stat.subscription_count),
      monthlyRevenue: parseFloat(stat.monthly_revenue)
    }));
  }

  /**
   * Format tier from database row
   *
   * @private
   * @param {Object} tier - Database row
   * @returns {Object} Formatted tier
   */
  formatTier(tier) {
    return {
      id: tier.id,
      clubId: tier.club_id,
      name: tier.name,
      description: tier.description,
      monthlyPrice: parseFloat(tier.monthly_price),
      annualPrice: tier.annual_price ? parseFloat(tier.annual_price) : null,
      billingFrequency: tier.billing_frequency,
      features: tier.features ? (typeof tier.features === 'string' ? JSON.parse(tier.features) : tier.features) : [],
      isActive: tier.is_active,
      sortOrder: tier.sort_order,
      createdAt: tier.created_at,
      updatedAt: tier.updated_at
    };
  }
}

export default MembershipTierService;
