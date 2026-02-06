export class TeamService {
  constructor(db) {
    this.db = db;
  }

  // Create a new team
  async createTeam(clubId, teamData) {
    try {
      const [teamId] = await this.db('teams')
        .insert({
          club_id: clubId,
          name: teamData.name,
          color: teamData.color || null,
          is_active: teamData.is_active !== undefined ? teamData.is_active : true,
          manager_id: teamData.manager_id ?? null,
          membership_tier_id: teamData.membership_tier_id ?? null,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      return {
        success: true,
        team_id: teamId,
        message: 'Team created successfully'
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  }

  // Get all teams for a club
  async getTeamsByClub(clubId) {
    try {
      const teams = await this.db('teams')
        .leftJoin('users', 'teams.manager_id', 'users.id')
        .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
        .leftJoin('membership_tiers', 'teams.membership_tier_id', 'membership_tiers.id')
        .select(
          'teams.*',
          'users.id as manager_user_id',
          'users.email as manager_email',
          'user_profiles.first_name as manager_first_name',
          'user_profiles.last_name as manager_last_name',
          'user_profiles.avatar as manager_avatar',
          'membership_tiers.name as membership_tier_name',
          'membership_tiers.monthly_price as membership_tier_monthly_price',
          'membership_tiers.annual_price as membership_tier_annual_price'
        )
        .where({ 'teams.club_id': clubId })
        .orderBy('teams.created_at', 'desc');

      // Get member counts for each team (based on team_members linking children to teams)
      const teamsWithCounts = await Promise.all(
        teams.map(async (team) => {
          const [memberCount] = await this.db('team_members')
            .count('* as count')
            .where({ team_id: team.id });

          return {
            ...team,
            manager_count: team.manager_user_id ? 1 : 0,
            member_count: parseInt(memberCount.count)
          };
        })
      );

      return teamsWithCounts;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw new Error('Failed to fetch teams');
    }
  }

  // Get single team with manager and members
  async getTeamById(teamId) {
    try {
      const team = await this.db('teams')
        .leftJoin('users', 'teams.manager_id', 'users.id')
        .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
        .select(
          'teams.*',
          'users.id as manager_user_id',
          'users.email as manager_email',
          'user_profiles.first_name as manager_first_name',
          'user_profiles.last_name as manager_last_name',
          'user_profiles.avatar as manager_avatar'
        )
        .where({ 'teams.id': teamId })
        .first();

      if (!team) {
        throw new Error('Team not found');
      }

      // Get team members
      const members = await this.db('user_accounts')
        .select(
          'user_accounts.*',
          'users.email',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'user_profiles.avatar'
        )
        .join('users', 'user_accounts.user_id', 'users.id')
        .join('user_profiles', 'users.id', 'user_profiles.user_id')
        .where({ team_id: teamId });

      // Format manager data for consistency
      const managers = team.manager_user_id ? [{
        id: team.manager_user_id,
        firstName: team.manager_first_name,
        lastName: team.manager_last_name,
        fullName: team.manager_first_name && team.manager_last_name ? `${team.manager_first_name} ${team.manager_last_name}` : null,
        isActive: true,
        createdAt: team.created_at?.toISOString()
      }] : [];

      return {
        ...team,
        managers,
        members: members.map(member => ({
          id: member.id,
          user_id: member.user_id,
          team_id: member.team_id,
          account_number: member.account_number,
          first_name: member.first_name,
          last_name: member.last_name,
          fullName: member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : null,
          email: member.email,
          position: member.position,
          avatar: member.avatar
        }))
      };
    } catch (error) {
      console.error('Error fetching team:', error);
      throw new Error('Failed to fetch team');
    }
  }

  // Update team details
  async updateTeam(teamId, teamData) {
    try {
      const updateData = {
        updated_at: new Date()
      };

      if (teamData.name !== undefined) updateData.name = teamData.name;
      if (teamData.color !== undefined) updateData.color = teamData.color;
      if (teamData.is_active !== undefined) updateData.is_active = teamData.is_active;
      if (teamData.manager_id !== undefined) updateData.manager_id = teamData.manager_id;
      if (teamData.membership_tier_id !== undefined) updateData.membership_tier_id = teamData.membership_tier_id;

      await this.db('teams')
        .where({ id: teamId })
        .update(updateData);

      return {
        success: true,
        message: 'Team updated successfully'
      };
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error('Failed to update team');
    }
  }

  // Delete team (set members' team_id to null)
  async deleteTeam(teamId) {
    try {
      await this.db.transaction(async (trx) => {
        // Remove all team member links (children assigned to this team)
        await trx('team_members')
          .where({ team_id: teamId })
          .del();

        // Delete the team itself
        await trx('teams')
          .where({ id: teamId })
          .del();
      });

      return {
        success: true,
        message: 'Team deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new Error('Failed to delete team');
    }
  }

  // Assign team manager to team
  async assignTeamManager(teamId, userId) {
    try {
      // Check if team already has a manager
      const team = await this.db('teams')
        .select('manager_id')
        .where({ id: teamId })
        .first();

      if (team.manager_id) {
        throw new Error('Team already has a manager. Remove the current manager first.');
      }

      // Update team with new manager
      await this.db('teams')
        .where({ id: teamId })
        .update({
          manager_id: userId,
          updated_at: new Date()
        });

      return {
        success: true,
        message: 'Team manager assigned successfully'
      };
    } catch (error) {
      console.error('Error assigning team manager:', error);
      throw new Error('Failed to assign team manager');
    }
  }

  // Remove team manager from team
  async removeTeamManager(teamId, userId) {
    try {
      // Check if the user is actually the manager of this team
      const team = await this.db('teams')
        .select('manager_id')
        .where({ id: teamId })
        .first();

      if (!team || team.manager_id !== userId) {
        throw new Error('User is not the manager of this team');
      }

      // Remove manager from team
      await this.db('teams')
        .where({ id: teamId })
        .update({
          manager_id: null,
          updated_at: new Date()
        });

      return {
        success: true,
        message: 'Team manager removed successfully'
      };
    } catch (error) {
      console.error('Error removing team manager:', error);
      throw new Error('Failed to remove team manager');
    }
  }

  // Get all managers for a team
  async getTeamManagers(teamId) {
    try {
      const team = await this.db('teams')
        .leftJoin('users', 'teams.manager_id', 'users.id')
        .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
        .select(
          'teams.id as team_id',
          'teams.manager_id as user_id',
          'teams.created_at as assigned_at',
          'users.email',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'user_profiles.avatar'
        )
        .where('teams.id', teamId)
        .first();

      if (!team || !team.user_id) {
        return [];
      }

      return [{
      id: team.user_id,
      firstName: team.first_name,
      lastName: team.last_name,
      fullName: team.first_name && team.last_name ? `${team.first_name} ${team.last_name}` : null,
      isActive: true,
      createdAt: team.created_at?.toISOString()
      }];
    } catch (error) {
      console.error('Error fetching team manager:', error);
      throw new Error('Failed to fetch team manager');
    }
  }

  // Assign member to team (with automatic subscription creation)
  async assignMemberToTeam(memberId, teamId, options = {}) {
    return this.db.transaction(async (trx) => {
      try {
        console.log('🔍 Looking for child with ID:', memberId);

        // 1. Get team details to verify club
        const team = await trx('teams')
          .where({ id: teamId })
          .first();

        if (!team) {
          throw new Error('Team not found');
        }

        // 2. CHECK: Team must have membership tier assigned
        if (!team.membership_tier_id) {
          throw new Error('Cannot assign member: Team has no membership tier assigned. Please assign a membership tier to this team first.');
        }

        // 3. Only allow children to be assigned to teams
        const childMember = await trx('user_children')
          .where({ id: memberId })
          .first();

        console.log('🔍 Child member:', childMember);
        console.log('🔍 Team club ID:', team.club_id);
        console.log('🔍 Child club ID:', childMember?.club_id);

        if (!childMember) {
          throw new Error('Player not found. Only players can be assigned to teams.');
        }

        // Verify player belongs to the same club as the team
        if (childMember.club_id !== team.club_id) {
          throw new Error('Player does not belong to the same club as the team.');
        }

        // 4. Check if player is already assigned to any team
        const existingAssignment = await trx('team_members')
          .where({ user_child_id: memberId })
          .first();

        if (existingAssignment) {
          if (existingAssignment.team_id === teamId) {
            throw new Error('Player is already assigned to this team');
          }
          // Remove from old team first
          console.log('🔄 Removing player from old team:', existingAssignment.team_id);
          await trx('team_members').where({ id: existingAssignment.id }).delete();
        }

        // 5. Handle subscription changes
        await this._handleSubscriptionForTeamChange(
          trx,
          childMember.child_user_id,  // The actual user ID
          childMember.parent_user_id,
          team,
          options
        );

        // 6. Assign player to team using team_members table
        await trx('team_members').insert({
          team_id: teamId,
          user_child_id: memberId,
          assigned_at: new Date()
        });

        return {
          success: true,
          message: 'Player assigned to team successfully'
        };
      } catch (error) {
        console.error('Error assigning player to team:', error);
        throw error;
      }
    });
  }

  // Handle subscription creation/cancellation when team changes
  async _handleSubscriptionForTeamChange(trx, childUserId, parentUserId, newTeam, options = {}) {
    const clubId = newTeam.club_id;

    // 1. Find ANY existing subscription for this child in this club (regardless of status)
    const existingSubscription = await trx('subscriptions')
      .where('child_user_id', childUserId)
      .where('club_id', clubId)
      .first();

    if (existingSubscription) {
      // 2a. If same team and active/pending, just return it
      if (existingSubscription.team_id === newTeam.id &&
          ['active', 'pending'].includes(existingSubscription.status)) {
        console.log('✅ Subscription already exists for this team');
        return existingSubscription;
      }

      // 2b. If same team but cancelled/suspended, reactivate it
      if (existingSubscription.team_id === newTeam.id) {
        console.log('🔄 Reactivating existing subscription:', existingSubscription.id);
        const [reactivated] = await trx('subscriptions')
          .where('id', existingSubscription.id)
          .update({
            status: 'active',
            cancelled_at: null,
            cancellation_reason: null,
            updated_at: new Date()
          })
          .returning('*');
        return reactivated;
      }

      // 2c. Different team - update the existing subscription to new team/tier
      console.log('🔄 Updating subscription to new team:', existingSubscription.id);

      // Get the tier for the new team
      const tier = await trx('membership_tiers')
        .where('id', newTeam.membership_tier_id)
        .first();

      if (!tier) {
        throw new Error('Membership tier not found for this team');
      }

      const billingDay = options.billingDayOfMonth || existingSubscription.billing_day_of_month || Math.min(new Date().getDate(), 28);
      const billingFrequency = options.billingFrequency || tier.billing_frequency || 'monthly';
      const amount = billingFrequency === 'annual'
        ? (tier.annual_price || tier.monthly_price * 12)
        : tier.monthly_price;

      const [updated] = await trx('subscriptions')
        .where('id', existingSubscription.id)
        .update({
          team_id: newTeam.id,
          membership_tier_id: newTeam.membership_tier_id,
          status: 'active',
          billing_frequency: billingFrequency,
          billing_day_of_month: billingDay,
          amount: amount,
          cancelled_at: null,
          cancellation_reason: null,
          updated_at: new Date()
        })
        .returning('*');

      console.log('✅ Updated subscription to new team/tier:', updated.id);
      return updated;
    }

    // 3. No existing subscription - create new one
    const tier = await trx('membership_tiers')
      .where('id', newTeam.membership_tier_id)
      .first();

    if (!tier) {
      throw new Error('Membership tier not found for this team');
    }
    const billingDay = options.billingDayOfMonth || Math.min(new Date().getDate(), 28);
    const billingFrequency = options.billingFrequency || tier.billing_frequency || 'monthly';
    const amount = billingFrequency === 'annual'
      ? (tier.annual_price || tier.monthly_price * 12)
      : tier.monthly_price;

    // Calculate billing dates
    const today = new Date();
    const nextBillingDate = new Date(today.getFullYear(), today.getMonth(), billingDay);
    if (nextBillingDate <= today) {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
    const periodEnd = new Date(nextBillingDate);
    if (billingFrequency === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    console.log('📝 Creating new subscription with tier:', tier.name, 'amount:', amount);

    const [newSubscription] = await trx('subscriptions')
      .insert({
        club_id: clubId,
        parent_user_id: parentUserId,
        child_user_id: childUserId,
        membership_tier_id: newTeam.membership_tier_id,
        team_id: newTeam.id,
        status: 'active',
        billing_frequency: billingFrequency,
        billing_day_of_month: billingDay,
        amount: amount,
        current_period_start: today,
        current_period_end: periodEnd,
        next_billing_date: nextBillingDate,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    console.log('✅ Created subscription:', newSubscription.id);
    return newSubscription;
  }

  // Remove player from team (with subscription cancellation at end of period)
  async removeMemberFromTeam(memberId, teamId) {
    return this.db.transaction(async (trx) => {
      try {
        // 1. Get the assignment
        const assignment = await trx('team_members')
          .where({ user_child_id: memberId })
          .first();

        if (!assignment) {
          throw new Error('Player not found or not assigned to any team');
        }

        // If teamId is provided, verify it matches
        if (teamId && assignment.team_id !== teamId) {
          throw new Error('Player is not assigned to the specified team');
        }

        // 2. Get child info for subscription lookup
        const child = await trx('user_children').where({ id: memberId }).first();

        // 3. Cancel subscription at end of billing period
        if (child) {
          const updatedCount = await trx('subscriptions')
            .where('child_user_id', child.child_user_id)
            .where('team_id', assignment.team_id)
            .whereIn('status', ['active', 'pending'])
            .update({
              status: 'cancelled',
              cancelled_at: new Date(),
              cancellation_reason: 'Removed from team',
              updated_at: new Date()
            });

          if (updatedCount > 0) {
            console.log('📝 Cancelled subscription for removed player');
          }
        }

        // 4. Remove from team
        await trx('team_members').where({ id: assignment.id }).delete();

        return {
          success: true,
          message: 'Player removed from team successfully'
        };
      } catch (error) {
        console.error('Error removing player from team:', error);
        throw error;
      }
    });
  }

  // Get all members in a team
  async getTeamMembers(teamId) {
    try {
      // Only get child members from team_members table (filter out inactive)
      const childMembers = await this.db('team_members')
        .select(
          'team_members.*',
          'user_children.*',
          'users.email',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'user_profiles.avatar',
          'user_profiles.position as child_position',
          'user_profiles.phone as child_phone',
          'pup.first_name as parent_first_name',
          'pup.last_name as parent_last_name',
          'pup.phone as parent_phone',
          'pu.email as parent_email',
          'ua.is_active as parent_is_active'
        )
        .join('user_children', 'team_members.user_child_id', 'user_children.id')
        .join('users', 'user_children.child_user_id', 'users.id')
        .join('user_profiles', 'users.id', 'user_profiles.user_id')
        .leftJoin('users as pu', 'user_children.parent_user_id', 'pu.id')
        .leftJoin('user_profiles as pup', 'pu.id', 'pup.user_id')
        .leftJoin('user_accounts as ua', 'pu.id', 'ua.user_id')
        .where('team_members.team_id', teamId)
        .where(function() {
          this.whereNull('ua.id').orWhere('ua.is_active', true);
        });

      // Map child members
      const allMembers = childMembers.map(child => ({
        id: child.user_child_id,
        user_id: child.child_user_id,
        team_id: teamId,
        account_number: `CHILD-${child.user_child_id}`,
        first_name: child.first_name,
        last_name: child.last_name,
        email: child.email,
        // Prefer position from child profile selection
        position: child.child_position || child.position || null,
        avatar: child.avatar,
        status: child.parent_is_active ? "Active" : "Inactive", // Use parent's account status
        member_type: 'child',
        phone: child.child_phone || null,
        assigned_at: child.assigned_at || null,
        parent_name: [child.parent_first_name, child.parent_last_name].filter(Boolean).join(' ').trim() || null,
        parent_phone: child.parent_phone || null,
        parent_email: child.parent_email || null
      }));

      return allMembers;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw new Error('Failed to fetch team members');
    }
  }

  // Get all children already assigned to any team in the club
  async getAssignedChildrenInClub(clubId) {
    try {
      const assignedChildren = await this.db('team_members')
        .select('team_members.user_child_id')
        .join('teams', 'team_members.team_id', 'teams.id')
        .where('teams.club_id', clubId);

      return assignedChildren.map(child => child.user_child_id);
    } catch (error) {
      console.error('Error fetching assigned children in club:', error);
      throw new Error('Failed to fetch assigned children in club');
    }
  }

  // Set the membership tier for a team
  async setTeamTier(teamId, membershipTierId, clubId) {
    try {
      // Validate tier belongs to club
      const tier = await this.db('membership_tiers')
        .where('id', membershipTierId)
        .where('club_id', clubId)
        .where('is_active', true)
        .first();

      if (!tier) {
        throw new Error('Membership tier not found or inactive');
      }

      // Validate team belongs to club
      const team = await this.db('teams')
        .where('id', teamId)
        .where('club_id', clubId)
        .first();

      if (!team) {
        throw new Error('Team not found');
      }

      // Update team with new tier
      await this.db('teams')
        .where('id', teamId)
        .update({
          membership_tier_id: membershipTierId,
          updated_at: new Date()
        });

      return {
        success: true,
        tier: {
          id: tier.id,
          name: tier.name,
          monthlyPrice: tier.monthly_price,
          annualPrice: tier.annual_price
        },
        message: `Team tier updated to "${tier.name}"`
      };
    } catch (error) {
      console.error('Error setting team tier:', error);
      throw error;
    }
  }
}
