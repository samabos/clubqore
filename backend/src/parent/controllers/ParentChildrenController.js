export class ParentChildrenController {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all children for the parent with enriched data
   * GET /parent/children
   */
  async getChildren(request, reply) {
    const parentUserId = request.user.id;

    try {
      // Get children with basic info
      const children = await this.db('user_children')
        .leftJoin('user_profiles', 'user_children.child_user_id', 'user_profiles.user_id')
        .leftJoin('clubs', 'user_children.club_id', 'clubs.id')
        .where('user_children.parent_user_id', parentUserId)
        .select(
          'user_children.id',
          'user_children.parent_user_id',
          'user_children.child_user_id',
          'user_children.club_id',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'user_profiles.date_of_birth',
          'user_profiles.position',
          'user_profiles.avatar',
          'clubs.name as club_name'
        );

      // Enrich each child with teams, events count, and invoice totals
      const enrichedChildren = await Promise.all(
        children.map(async (child) => {
          // Get teams for this child with membership tier info
          const teams = await this.db('team_members')
            .join('teams', 'team_members.team_id', 'teams.id')
            .leftJoin('membership_tiers', 'teams.membership_tier_id', 'membership_tiers.id')
            .where('team_members.user_child_id', child.id)
            .select(
              'teams.id',
              'teams.name',
              'team_members.assigned_at',
              'membership_tiers.id as membership_tier_id',
              'membership_tiers.name as membership_tier_name',
              'membership_tiers.monthly_price as membership_tier_monthly_price',
              'membership_tiers.annual_price as membership_tier_annual_price',
              'membership_tiers.billing_frequency as membership_tier_billing_frequency'
            );

          // Get team IDs for event counting
          const teamIds = teams.map(t => t.id);

          let upcomingEventsCount = 0;

          if (teamIds.length > 0) {
            // Count training sessions (exclude drafts)
            // Use CURRENT_DATE for date comparison since date column is DATE type (not TIMESTAMP)
            const trainingCount = await this.db('training_sessions')
              .join('training_session_teams', 'training_sessions.id', 'training_session_teams.training_session_id')
              .whereIn('training_session_teams.team_id', teamIds)
              .whereRaw('training_sessions.date >= CURRENT_DATE')
              .where('training_sessions.status', '!=', 'draft')
              .count('* as count')
              .first();

            // Count matches (exclude drafts)
            // Use CURRENT_DATE for date comparison since date column is DATE type (not TIMESTAMP)
            const matchCount = await this.db('matches')
              .where(function() {
                this.whereIn('matches.home_team_id', teamIds)
                  .orWhereIn('matches.away_team_id', teamIds);
              })
              .whereRaw('matches.date >= CURRENT_DATE')
              .where('matches.status', '!=', 'draft')
              .count('* as count')
              .first();

            upcomingEventsCount = Number(trainingCount.count) + Number(matchCount.count);
          }

          // Get pending invoices for this child
          const invoiceStats = await this.db('invoices')
            .where('child_user_id', child.child_user_id)
            .whereIn('status', ['pending', 'overdue'])
            .select(
              this.db.raw('COALESCE(SUM(total_amount), 0) as total'),
              this.db.raw('COUNT(*) as count')
            )
            .first();

          // Format teams with membership tier info
          const formattedTeams = teams.map(team => ({
            id: team.id,
            name: team.name,
            assigned_at: team.assigned_at,
            membershipTier: team.membership_tier_id ? {
              id: team.membership_tier_id,
              name: team.membership_tier_name,
              monthlyPrice: Number(team.membership_tier_monthly_price),
              annualPrice: team.membership_tier_annual_price ? Number(team.membership_tier_annual_price) : null,
              billingFrequency: team.membership_tier_billing_frequency
            } : null
          }));

          return {
            id: child.id,
            firstName: child.first_name,
            lastName: child.last_name,
            dateOfBirth: child.date_of_birth,
            childUserId: child.child_user_id,
            clubId: child.club_id,
            clubName: child.club_name,
            enrollmentStatus: 'active', // Default value since column doesn't exist
            position: child.position || null,
            profileImage: child.avatar || null,
            teams: formattedTeams,
            upcomingEventsCount: upcomingEventsCount,
            pendingInvoices: {
              count: Number(invoiceStats.count),
              total: Number(invoiceStats.total)
            }
          };
        })
      );

      return reply.send({
        children: enrichedChildren
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        message: 'Failed to fetch children'
      });
    }
  }

  /**
   * Get detailed information for a specific child
   * GET /parent/children/:childId
   */
  async getChildDetails(request, reply) {
    const parentUserId = request.user.id;
    const { childId } = request.params;

    try {
      // Verify parent owns this child and get extended info
      const child = await this.db('user_children')
        .leftJoin('user_profiles', 'user_children.child_user_id', 'user_profiles.user_id')
        .leftJoin('clubs', 'user_children.club_id', 'clubs.id')
        .where({
          'user_children.id': childId,
          'user_children.parent_user_id': parentUserId
        })
        .select(
          'user_children.id',
          'user_children.parent_user_id',
          'user_children.child_user_id',
          'user_children.club_id',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'user_profiles.date_of_birth',
          'user_profiles.position',
          'user_profiles.avatar',
          'user_profiles.medical_info',
          'user_profiles.emergency_contact',
          'user_profiles.phone',
          'user_profiles.address',
          'clubs.name as club_name'
        )
        .first();

      if (!child) {
        return reply.status(404).send({
          message: 'Child not found or you do not have access'
        });
      }

      // Get teams for this child with membership tier info
      const teams = await this.db('team_members')
        .join('teams', 'team_members.team_id', 'teams.id')
        .leftJoin('membership_tiers', 'teams.membership_tier_id', 'membership_tiers.id')
        .where('team_members.user_child_id', child.id)
        .select(
          'teams.id',
          'teams.name',
          'team_members.assigned_at',
          'membership_tiers.id as membership_tier_id',
          'membership_tiers.name as membership_tier_name',
          'membership_tiers.monthly_price as membership_tier_monthly_price',
              'membership_tiers.annual_price as membership_tier_annual_price',
          'membership_tiers.billing_frequency as membership_tier_billing_frequency'
        );

      // Get team IDs for event counting
      const teamIds = teams.map(t => t.id);

      let upcomingEventsCount = 0;

      if (teamIds.length > 0) {
        // Count training sessions (exclude drafts)
        // Use CURRENT_DATE for date comparison since date column is DATE type (not TIMESTAMP)
        const trainingCount = await this.db('training_sessions')
          .join('training_session_teams', 'training_sessions.id', 'training_session_teams.training_session_id')
          .whereIn('training_session_teams.team_id', teamIds)
          .whereRaw('training_sessions.date >= CURRENT_DATE')
          .where('training_sessions.status', '!=', 'draft')
          .count('* as count')
          .first();

        // Count matches (exclude drafts)
        // Use CURRENT_DATE for date comparison since date column is DATE type (not TIMESTAMP)
        const matchCount = await this.db('matches')
          .where(function() {
            this.whereIn('matches.home_team_id', teamIds)
              .orWhereIn('matches.away_team_id', teamIds);
          })
          .whereRaw('matches.date >= CURRENT_DATE')
          .where('matches.status', '!=', 'draft')
          .count('* as count')
          .first();

        upcomingEventsCount = Number(trainingCount.count) + Number(matchCount.count);
      }

      // Get pending invoices for this child
      const invoiceStats = await this.db('invoices')
        .where('child_user_id', child.child_user_id)
        .whereIn('status', ['pending', 'overdue'])
        .select(
          this.db.raw('COALESCE(SUM(total_amount), 0) as total'),
          this.db.raw('COUNT(*) as count')
        )
        .first();

      // Format teams with membership tier info
      const formattedTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        assigned_at: team.assigned_at,
        membershipTier: team.membership_tier_id ? {
          id: team.membership_tier_id,
          name: team.membership_tier_name,
          monthlyPrice: Number(team.membership_tier_monthly_price),
          annualPrice: team.membership_tier_annual_price ? Number(team.membership_tier_annual_price) : null,
          billingFrequency: team.membership_tier_billing_frequency
        } : null
      }));

      const enrichedChild = {
        id: child.id,
        firstName: child.first_name,
        lastName: child.last_name,
        dateOfBirth: child.date_of_birth,
        childUserId: child.child_user_id,
        clubId: child.club_id,
        clubName: child.club_name,
        enrollmentStatus: 'active', // Default value since column doesn't exist
        position: child.position || null,
        profileImage: child.avatar || null,
        medicalInfo: child.medical_info || null,
        emergencyContact: child.emergency_contact || null,
        phone: child.phone || null,
        address: child.address || null,
        teams: formattedTeams,
        upcomingEventsCount: upcomingEventsCount,
        pendingInvoices: {
          count: Number(invoiceStats.count),
          total: Number(invoiceStats.total)
        }
      };

      return reply.send({
        child: enrichedChild
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        message: 'Failed to fetch child details'
      });
    }
  }

  /**
   * Create a new child
   * POST /parent/children
   */
  async createChild(request, reply) {
    const parentUserId = request.user.id;

    try {
      const newChild = await this.parentChildrenService.createChild(
        parentUserId,
        request.body
      );

      return reply.status(201).send({
        success: true,
        child: newChild,
        message: 'Child added successfully'
      });
    } catch (error) {
      request.log.error(error);

      const statusCode = error.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        message: error.message || 'Failed to add child'
      });
    }
  }

  /**
   * Update child information
   * PATCH /parent/children/:childId
   */
  async updateChild(request, reply) {
    const parentUserId = request.user.id;
    const { childId } = request.params;

    try {
      const updatedChild = await this.parentChildrenService.updateChild(
        parentUserId,
        parseInt(childId),
        request.body
      );

      return reply.send({
        success: true,
        child: updatedChild,
        message: 'Child information updated successfully'
      });
    } catch (error) {
      request.log.error(error);

      const statusCode = error.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        message: error.message || 'Failed to update child information'
      });
    }
  }
}
