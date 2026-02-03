import { RoleService } from '../../onboarding/services/RoleService.js';

export class ClubService {
  constructor(db) {
    this.db = db;
    this.roleService = new RoleService(db);
  }

  /**
   * Create new club (during club manager onboarding)
   */
  async createClub(clubData, createdBy, trx = null) {
    const db = trx || this.db;

    // Handle address dual-write (both TEXT and JSONB)
    let addressText = null;
    let addressStructured = null;

    if (clubData.address) {
      if (typeof clubData.address === 'string') {
        // Legacy string format - write to TEXT column only
        addressText = clubData.address;
      } else if (typeof clubData.address === 'object') {
        // New structured format - write to both columns
        addressStructured = JSON.stringify(clubData.address);
        // Also write to TEXT column for backward compatibility (use street or full address)
        addressText = clubData.address.street || null;
      }
    }

    const club = await db('clubs').insert({
      name: clubData.name,
      club_type: clubData.clubType || clubData.type,
      description: clubData.description || null,
      founded_year: clubData.foundedYear || null,
      membership_capacity: clubData.membershipCapacity || null,
      website: clubData.website || null,
      address: addressText,
      address_structured: addressStructured,
      phone: clubData.phone || null,
      email: clubData.email || null,
      logo_url: clubData.logoUrl || null,
      created_by: createdBy,
      is_active: true,
      verified: false, // Requires admin verification
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    return this.formatClub(club[0]);
  }

  /**
   * Create new club with user role and account records (for club setup)
   */
  async createClubWithRole(clubData, createdBy) {
    console.log(`Creating club with role for user ${createdBy}:`, clubData);
    return await this.db.transaction(async (trx) => {
      // 1. Create the club
      const club = await this.createClub(clubData, createdBy, trx);
      const clubId = parseInt(club.id);
      console.log(`Club created with ID: ${clubId}`);

      // 2. Get club_manager role ID
      const clubManagerRoleId = await this.roleService.getRoleIdByName('club_manager');

      // 3. Create user_roles record
      console.log(`Creating user_roles record for user ${createdBy}, club ${clubId}`);
      await trx('user_roles').insert({
        user_id: createdBy,
        role_id: clubManagerRoleId,
        club_id: clubId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      // 4. Update user's onboarding status
      console.log(`Updating user ${createdBy} onboarding status`);
      await trx('users')
        .where({ id: createdBy })
        .update({
          is_onboarded: true,
          onboarding_completed_at: new Date(),
          updated_at: new Date()
        });

      return club;
    });
  }

  /**
   * Get club details by ID
   */
  async getClubById(clubId) {
    const club = await this.db('clubs')
      .where({ id: clubId })
      .first();

    if (!club) {
      throw new Error('Club not found');
    }

    return this.formatClub(club);
  }

  /**
   * Update club information
   */
  async updateClub(clubId, updateData, userId) {
    // Verify user is the club manager
    const club = await this.db('clubs')
      .where({ id: clubId })
      .first();

    if (!club) {
      throw new Error('Club not found');
    }

    if (club.created_by !== userId) {
      throw new Error('Only club managers can update club information');
    }

    // Handle address dual-write (both TEXT and JSONB)
    let addressText = undefined;
    let addressStructured = undefined;

    if (updateData.address !== undefined) {
      if (updateData.address === null) {
        addressText = null;
        addressStructured = null;
      } else if (typeof updateData.address === 'string') {
        // Legacy string format - write to TEXT column only
        addressText = updateData.address;
      } else if (typeof updateData.address === 'object') {
        // New structured format - write to both columns
        addressStructured = JSON.stringify(updateData.address);
        // Also write to TEXT column for backward compatibility
        addressText = updateData.address.street || null;
      }
    }

    const updateFields = {
      name: updateData.name,
      club_type: updateData.clubType,
      description: updateData.description,
      founded_year: updateData.foundedYear,
      membership_capacity: updateData.membershipCapacity,
      website: updateData.website,
      address: addressText,
      address_structured: addressStructured,
      phone: updateData.phone,
      email: updateData.email,
      logo_url: updateData.logoUrl,
      updated_at: new Date()
    };

    // Remove undefined values
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    await this.db('clubs')
      .where({ id: clubId })
      .update(updateFields);

    return await this.getClubById(clubId);
  }

  /**
   * Get clubs managed by a user
   */
  async getClubsByManager(managerId) {
    const clubs = await this.db('clubs')
      .join('user_roles', 'clubs.id', 'user_roles.club_id')
      .where('user_roles.user_id', managerId)
      .where('user_roles.is_active', true)
      .where('clubs.is_active', true)
      .select('clubs.*')
      .orderBy('clubs.created_at', 'desc');

    return clubs.map(club => this.formatClub(club));
  }

  /**
   * Get clubs where user has any role
   */
  async getClubsByUser(userId) {
    const clubs = await this.db('clubs')
      .join('user_roles', 'clubs.id', 'user_roles.club_id')
      .where('user_roles.user_id', userId)
      .where('user_roles.is_active', true)
      .where('clubs.is_active', true)
      .select('clubs.*', 'user_roles.role', 'user_roles.created_at as joined_at')
      .orderBy('user_roles.created_at', 'desc');

    return clubs.map(club => ({
      ...this.formatClub(club),
      userRole: club.role,
      joinedAt: club.joined_at.toISOString()
    }));
  }

  /**
   * Browse clubs by category
   */
  async browseClubs(limit = 20) {
    const featured = await this.getFeaturedClubs(limit);
    const byCategory = await this.getClubsByCategory();

    return {
      featured,
      byCategory,
      recommended: [] // TODO: Implement recommendation logic
    };
  }

  /**
   * Get member count for a club (used by club browsing features)
   */
  async getMemberCount(clubId) {
    const result = await this.db('user_roles')
      .where({ club_id: clubId, is_active: true })
      .count('id as count')
      .first();

    return parseInt(result.count) || 0;
  }

  /**
   * Search clubs with filters
   */
  async searchClubs(searchParams) {
    let query = this.db('clubs')
      .where('is_active', true);

    // Apply search filters
    if (searchParams.query) {
      query = query.where(function() {
        this.where('name', 'like', `%${searchParams.query}%`)
            .orWhere('description', 'like', `%${searchParams.query}%`);
      });
    }

    if (searchParams.club_type) {
      query = query.where('club_type', searchParams.club_type);
    }

    if (searchParams.verified !== undefined) {
      query = query.where('verified', searchParams.verified);
    }

    // Pagination
    const page = searchParams.page || 1;
    const limit = Math.min(searchParams.limit || 20, 100);
    const offset = (page - 1) * limit;

    const clubs = await query
      .offset(offset)
      .limit(limit)
      .orderBy('verified', 'desc')
      .orderBy('created_at', 'desc');

    // Get total count for pagination
    const totalResult = await this.db('clubs')
      .where('is_active', true)
      .count('id as count')
      .first();
    const total = parseInt(totalResult.count) || 0;

    // Add member count to each club
    const clubsWithCounts = await Promise.all(
      clubs.map(async (club) => ({
        ...this.formatClubSummary(club),
        memberCount: await this.getMemberCount(club.id)
      }))
    );

    return {
      clubs: clubsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get featured clubs for browsing
   */
  async getFeaturedClubs(limit = 10) {
    const clubs = await this.db('clubs')
      .where({ is_active: true, verified: true })
      .orderBy('created_at', 'desc')
      .limit(limit);

    return Promise.all(
      clubs.map(async (club) => ({
        ...this.formatClubSummary(club),
        memberCount: await this.getMemberCount(club.id)
      }))
    );
  }

  /**
   * Get clubs organized by category
   */
  async getClubsByCategory() {
    const clubs = await this.db('clubs')
      .where('is_active', true)
      .orderBy('club_type')
      .orderBy('created_at', 'desc');

    const byCategory = {};

    for (const club of clubs) {
      const category = club.club_type;
      if (!byCategory[category]) {
        byCategory[category] = [];
      }

      byCategory[category].push({
        ...this.formatClubSummary(club),
        memberCount: await this.getMemberCount(club.id)
      });
    }

    return byCategory;
  }

  /**
   * Format club data for API response
   */
  formatClub(club) {
    // Parse address - prefer structured format, fallback to text
    let address = null;
    if (club.address_structured) {
      try {
        address = JSON.parse(club.address_structured);
      } catch (e) {
        console.error('Failed to parse address_structured:', e);
        address = club.address || null;
      }
    } else {
      address = club.address || null;
    }

    return {
      id: club.id.toString(),
      name: club.name,
      clubType: club.club_type,
      category: club.club_type,  // Add category alias for backward compatibility
      description: club.description,
      foundedYear: club.founded_year,
      membershipCapacity: club.membership_capacity,
      website: club.website,
      address,
      phone: club.phone,
      email: club.email,
      logoUrl: club.logo_url,
      createdBy: club.created_by,
      isActive: club.is_active,
      verified: club.verified,
      createdAt: club.created_at.toISOString(),
      updatedAt: club.updated_at.toISOString()
    };
  }

  /**
   * Format club summary for search results
   */
  formatClubSummary(club) {
    return {
      id: club.id.toString(),
      name: club.name,
      clubType: club.club_type,
      description: club.description,
      address: club.address,
      verified: club.verified,
      logoUrl: club.logo_url
    };
  }

  /**
   * Get club name by ID (utility method)
   */
  async getClubName(clubId) {
    const club = await this.db('clubs')
      .where({ id: clubId })
      .select('name')
      .first();

    return club?.name;
  }

  /**
   * Get club ID for a club manager user
   */
  async getManagersClubId(userId) {
    // Get club_manager role ID
    const clubManagerRoleId = await this.roleService.getRoleIdByName('club_manager');

    const role = await this.db('user_roles')
      .select('club_id')
      .where({ user_id: userId, role_id: clubManagerRoleId, is_active: true })
      .first();

    return role?.club_id || null;
  }

  /**
   * Get all personnel (team managers and staff) for a club
   */
  async getTeamManagers(clubId) {
    const teamManagers = await this.db('user_roles')
      .join('users', 'user_roles.user_id', 'users.id')
      .join('user_profiles', 'user_roles.user_id', 'user_profiles.user_id')
      .leftJoin('user_accounts', function() {
        this.on('user_roles.user_id', '=', 'user_accounts.user_id')
            .andOn('user_roles.club_id', '=', 'user_accounts.club_id');
      })
      .where('user_roles.club_id', clubId)
      .whereIn('user_roles.role', ['team_manager', 'staff'])
      .where('user_roles.is_active', true)
      .select(
        'user_roles.user_id',
        'user_profiles.first_name',
        'user_profiles.last_name',
        'user_roles.is_active',
        'user_roles.created_at'
      )
      .orderBy('user_roles.created_at', 'desc');

    return teamManagers.map(tm => ({
      id: tm.user_id.toString(),
      firstName: tm.first_name,
      lastName: tm.last_name,
      fullName: tm.first_name && tm.last_name ? `${tm.first_name} ${tm.last_name}` : null,
      isActive: tm.is_active,
      createdAt: tm.created_at?.toISOString()
    }));
  }

  /**
   * Upload club logo (base64 data)
   */
  async uploadClubLogo(clubId, logoData) {
    try {
      // Update the club's logo_url field with base64 data
      await this.db('clubs')
        .where({ id: clubId })
        .update({
          logo_url: logoData,
          updated_at: new Date()
        });

      return {
        success: true,
        logo_url: logoData,
        message: 'Club logo updated successfully'
      };
    } catch (error) {
      console.error('Error uploading club logo:', error);
      throw new Error('Failed to upload club logo');
    }
  }
}
