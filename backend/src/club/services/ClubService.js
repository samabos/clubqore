import { UserCreationUtils, ProfileUtils, AccountUtils, ValidationUtils, ChildUtils } from '../../onboarding/utils/index.js';
import { emailService } from '../../services/emailService.js';
import { EmailOutboxService } from '../../services/emailOutboxService.js';
import { config } from '../../config/index.js';
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

  async isEmailAvailable(email) {
    const existing = await this.db('users')
      .where({ email })
      .first();
    return !existing;
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

      // 2. Generate unique account number
      // const { AccountNumberService } = await import('./AccountNumberService.js');
      // const accountNumberService = new AccountNumberService(this.db);
      // const accountNumber = await accountNumberService.generateAccountNumber(trx);

      // 3. Get club_manager role ID
      const clubManagerRoleId = await this.roleService.getRoleIdByName('club_manager');

      // 4. Create user_roles record
      console.log(`Creating user_roles record for user ${createdBy}, club ${clubId}`);
      await trx('user_roles').insert({
        user_id: createdBy,
        role_id: clubManagerRoleId,
        club_id: clubId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      // 5. Update user's onboarding status
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
    const featured = await this.clubService.getFeaturedClubs(limit);
    const byCategory = await this.clubService.getClubsByCategory();
    
    return {
      featured,
      byCategory,
      recommended: [] // TODO: Implement recommendation logic
    };
  }

  /**
   * Check if user is member of club
   */
  async isUserMember(clubId, userId) {
    const membership = await this.db('user_roles')
      .where({
        user_id: userId,
        club_id: clubId,
        is_active: true
      })
      .first();

    return !!membership;
  }

  /**
   * Get member count for a club
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

  async getMemberStatsByClub(clubId) {
    const counts = await this.db('user_accounts')
      .where({ club_id: clubId, is_active: true })
      .select('role')
      .count({ count: '*' })
      .groupBy('role');
    
    const total = counts.reduce((sum, r) => sum + Number(r.count), 0);
    const byRole = counts.reduce((acc, r) => {
      acc[r.role] = Number(r.count);
      return acc;
    }, {});
    
    return { total, byRole };
  }

  async getManagersClubId(userId) {
    // Get club_manager role ID
    const clubManagerRoleId = await this.roleService.getRoleIdByName('club_manager');

    const role = await this.db('user_roles')
      .select('club_id')
      .where({ user_id: userId, role_id: clubManagerRoleId, is_active: true })
      .first();

    return role?.club_id || null;
  }

  async assertUserInClub(userId, clubId) {
    const role = await this.db('user_roles')
      .where({ user_id: userId, club_id: clubId, is_active: true })
      .first();
    if (!role) {
      const err = new Error('Access denied. You are not a member of this club.');
      err.statusCode = 403;
      throw err;
    }
  }

  async listMembersByClub(clubId) {
    const members = await this.db('user_accounts as ua')
      .leftJoin('user_profiles as up', 'ua.user_id', 'up.user_id')
      .leftJoin('users as u', 'ua.user_id', 'u.id')
      .where({ 'ua.club_id': clubId })
      .select([
        'ua.id',
        'ua.user_id',
        'ua.account_number',
        'ua.role',
        'up.position',
        'ua.is_active',
        'ua.onboarding_completed_at',
        this.db.raw('ua.created_at as join_date'),
        'up.first_name',
        'up.last_name',
        'up.date_of_birth',
        'up.phone',
        'up.avatar',
        'u.email'
      ])
      .orderBy('ua.created_at', 'desc');

    // Parent-child relationships
    const children = await this.db('user_children as uc')
      .leftJoin('users as c', 'uc.child_user_id', 'c.id')
      .leftJoin('user_profiles as cup', 'uc.child_user_id', 'cup.user_id')
      .leftJoin('users as p', 'uc.parent_user_id', 'p.id')
      .leftJoin('user_profiles as pup', 'uc.parent_user_id', 'pup.user_id')
      .leftJoin('user_accounts as pa', 'uc.parent_user_id', 'pa.user_id')
      .where('uc.club_id', clubId)
      .select([
        'uc.id',
        'uc.parent_user_id',
        'uc.child_user_id',
        'uc.club_id',
        this.db.raw('uc.created_at as child_join_date'),
        'cup.position as child_position',
        'cup.first_name as child_first_name',
        'cup.last_name as child_last_name',
        'cup.date_of_birth as child_date_of_birth',
        'cup.avatar as child_avatar',
        this.db.raw('COALESCE(pup.first_name, \'\') as parent_first_name'),
        this.db.raw('COALESCE(pup.last_name, \'\') as parent_last_name'),
        this.db.raw('COALESCE(pup.phone, \'\') as parent_phone'),
        'pa.account_number as parent_account_number',
        'pa.id as parent_account_id',
        'pa.is_active as parent_is_active'
      ]);

    // Fetch team info for children (team name and color)
    const childTeamRows = await this.db('team_members as tm')
      .leftJoin('teams as t', 'tm.team_id', 't.id')
      .where('t.club_id', clubId)
      .select([
        'tm.user_child_id',
        'tm.team_id as team_id',
        't.name as team_name',
        't.color as team_color',
        'tm.assigned_at'
      ]);

    // Map child user id -> latest team info
    const childIdToTeam = new Map();
    for (const row of childTeamRows) {
      const existing = childIdToTeam.get(row.user_child_id);
      if (!existing || (row.assigned_at && existing.assigned_at && new Date(row.assigned_at) > new Date(existing.assigned_at))) {
        childIdToTeam.set(row.user_child_id, { team_id: row.team_id, team_name: row.team_name, team_color: row.team_color, assigned_at: row.assigned_at });
      } else if (!existing) {
        childIdToTeam.set(row.user_child_id, { team_id: row.team_id, team_name: row.team_name, team_color: row.team_color, assigned_at: row.assigned_at });
      }
    }

    // map relations
    const userIdToRelations = new Map();
    for (const rel of children) {
      if (!userIdToRelations.has(rel.parent_user_id)) userIdToRelations.set(rel.parent_user_id, { children: [] });
      
      // Include children (all children now have user accounts due to schema change)
      if (rel.child_user_id && rel.child_first_name && rel.child_last_name) {
        userIdToRelations.get(rel.parent_user_id).children.push({
          id: rel.child_user_id,
          name: `${rel.child_first_name} ${rel.child_last_name}`.trim(),
          firstName: rel.child_first_name,
          lastName: rel.child_last_name,
          dateOfBirth: rel.child_date_of_birth,
          position: rel.child_position || null,
          isRegistered: true // All children now have user accounts
        });
      }
    }

    // Map regular members (for other purposes, not team assignment)
    const regularMembers = members.map((m) => {
      const rel = userIdToRelations.get(m.user_id) || { children: [] };
      
      // Find parents for this member (if they are a child)
      const memberParents = [];
      if (m.role === 'member') {
        // Find all user_children records where this user is the child
        const parentRelations = children.filter(c => c.child_user_id === m.user_id);
        memberParents.push(...parentRelations.map(p => ({
          id: p.parent_user_id,
          name: `${p.parent_first_name || ''} ${p.parent_last_name || ''}`.trim(),
          phone: p.parent_phone || ''
        })));
      }
      
      return {
        id: m.id,
        user_id: m.user_id, // Add user_id for update operations
        accountId: m.id,
        name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
        email: m.email || '',
        phone: m.phone || '',
        position: m.position || '',
        age: m.date_of_birth ? Math.floor((new Date() - new Date(m.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
        status: m.is_active ? "Active" : "Inactive",
        joinDate: m.join_date,
        membershipType: m.role === 'parent' ? 'parent' : 'member',
        profileImage: m.avatar || '',
        accountNumber: m.account_number || '',
        onboardingCompleted: !!m.onboarding_completed_at,
        children: rel.children,
        parents: memberParents,
        hasChildren: rel.children.length > 0,
        hasParents: memberParents.length > 0
      };
    });

    // Map children as separate members for team assignment
    const childMembers = children
      .filter(child => child.child_user_id && child.child_first_name && child.child_last_name)
      .map(child => ({
        id: child.id, // Use user_children.id (primary key) for team assignment
        user_id: child.child_user_id,
        accountId: child.parent_account_id, // Use parent's account ID for contract operations
        name: `${child.child_first_name} ${child.child_last_name}`.trim(),
        email: '', // Children don't have email
        phone: '',
        position: child.child_position || '',
        age: child.child_date_of_birth ? Math.floor((new Date() - new Date(child.child_date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
        status: child.parent_is_active ? "Active" : "Inactive", // Use parent's account status
        joinDate: child.child_join_date,
        membershipType: 'member',
        accountNumber: child.parent_account_number || '', // Use parent's account number
        profileImage: child.child_avatar || '',
        team_id: (childIdToTeam.get(child.id) || {}).team_id || null,
        team_name: (childIdToTeam.get(child.id) || {}).team_name || null,
        team_color: (childIdToTeam.get(child.id) || {}).team_color || null,
        onboardingCompleted: true,
        children: [],
        parents: [{
          id: child.parent_user_id,
          name: `${child.parent_first_name || ''} ${child.parent_last_name || ''}`.trim(),
          phone: child.parent_phone || ''
        }],
        hasChildren: false,
        hasParents: true
      }));

    // Return both regular members (parents and members) and child members
    return [...regularMembers, ...childMembers];
  }

  async createParentAndChildren(clubId, memberData) {
    ValidationUtils.validateUserData(memberData);

    return await this.db.transaction(async (trx) => {
      // Create parent user
      // Check if email already exists
      const existingUser = await trx('users')
        .where({ email: memberData.email })
        .first();
      if (existingUser) {
        const err = new Error('Email already exists');
        err.statusCode = 409;
        throw err;
      }

      const { user: parent, generatedPassword } = await UserCreationUtils.createUser({
        email: memberData.email,
        password: memberData.password,
        generatePassword: memberData.generatePassword,
        primaryRole: 'parent',
        emailVerified: false,
        isOnboarded: true
      }, trx);

      // Create parent profile
      await ProfileUtils.createProfile(parent.id, {
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        phone: memberData.phone,
        position: memberData.position
      }, trx);

      // Create role and account for parent
      const accountNumber = UserCreationUtils.generateAccountNumber();
      await AccountUtils.createRoleAndAccount(parent.id, 'parent', clubId, accountNumber, trx);

      // Children
      const createdChildren = [];
      for (const child of memberData.children || []) {
        ValidationUtils.validateChildData(child);
        
        const childUser = await UserCreationUtils.createChildUser(parent.id, trx);
        
        await ProfileUtils.createProfile(childUser.id, {
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth,
          position: child.position
        }, trx);

        await trx('user_children').insert({
          parent_user_id: parent.id,
          child_user_id: childUser.id,
          club_id: clubId,
          created_at: new Date(),
          updated_at: new Date()
        });

        createdChildren.push({ id: childUser.id });
      }

      // Send welcome email using database template (optional)
      if (memberData.sendWelcomeEmail) {
        const outbox = new EmailOutboxService(trx, emailService);
        const loginUrl = `${config.app.frontendUrl}/login`;
        const userName = [memberData.firstName, memberData.lastName].filter(Boolean).join(' ').trim() || 'there';

        await outbox.sendAndLog({
          to: parent.email,
          templateKey: 'member_welcome',
          templateData: {
            userName,
            email: parent.email,
            temporaryPassword: generatedPassword || null,
            accountNumber,
            loginUrl
          }
        });
      }

      return {
        success: true,
        member: {
          id: parent.id,
          email: parent.email,
          accountNumber,
          generatedPassword: generatedPassword
        },
        children: createdChildren
      };
    });
  }

  /**
   * Get a specific member by ID
   */
  async getMemberById(clubId, memberId) {
    const members = await this.listMembersByClub(clubId);
    const member = members.find(m => m.id === memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }
    
    return member;
  }

  /**
   * Update a member's information
   */
  async updateMember(clubId, memberId, updateData) {
    // First verify the member exists and belongs to the club
    const existingMember = await this.getMemberById(clubId, memberId);
    
    return await this.db.transaction(async (trx) => {
       // Update user profile if basic info is provided
       if (updateData.firstName || updateData.lastName || updateData.phone || updateData.position !== undefined) {
         const profileUpdate = {};
         if (updateData.firstName !== undefined) profileUpdate.first_name = updateData.firstName;
         if (updateData.lastName !== undefined) profileUpdate.last_name = updateData.lastName;
         if (updateData.phone !== undefined) profileUpdate.phone = updateData.phone;
         if (updateData.position !== undefined) profileUpdate.position = updateData.position;
         profileUpdate.updated_at = new Date();

         await trx('user_profiles')
           .where({ user_id: existingMember.user_id })
           .update(profileUpdate);
       }

      // Update children if provided
      if (updateData.children && Array.isArray(updateData.children)) {
        // Get existing children for this parent
        const existingChildren = await trx('user_children')
          .where({ parent_user_id: existingMember.user_id })
          .select('*');

        // Create a map of existing children by their child_user_id
        const existingChildrenMap = new Map();
        existingChildren.forEach(child => {
          if (child.child_user_id) {
            existingChildrenMap.set(child.child_user_id.toString(), child);
          }
        });

        // Process each child in the update data
        for (const child of updateData.children) {
          if (child.childUserId) {
            // Updating existing child
            const existingChild = existingChildrenMap.get(child.childUserId.toString());

            if (existingChild) {
              // Update existing child profile
              await trx('user_profiles')
                .where({ user_id: existingChild.child_user_id })
                .update({
                  first_name: child.firstName,
                  last_name: child.lastName,
                  date_of_birth: child.dateOfBirth,
                  position: child.position,
                  updated_at: new Date()
                });

              // Update child relationship if needed
              await trx('user_children')
                .where({ id: existingChild.id })
                .update({
                  club_id: child.clubId || clubId,
                  updated_at: new Date()
                });
            } else {
              throw new Error(`Child with ID ${child.childUserId} not found for this parent`);
            }
          } else {
            // Creating new child - no childUserId provided yet
            ValidationUtils.validateChildData(child);
            
            // Create new child user and relationship
            await ChildUtils.createChildUserAndRelationship(
              existingMember.user_id,
              {
                firstName: child.firstName,
                lastName: child.lastName,
                dateOfBirth: child.dateOfBirth,
                position: child.position,
                clubId: clubId // Use the clubId from the method parameter
              },
              trx
            );
          }
        }

        // Remove children that are no longer in the update data
        // Only consider existing children (those with childUserId) for removal
        const updatedChildUserIds = updateData.children
          .filter(child => child.childUserId)
          .map(child => child.childUserId.toString());

        for (const [childUserId, existingChild] of existingChildrenMap) {
          if (!updatedChildUserIds.includes(childUserId)) {
            // Remove this child relationship
            await trx('user_children')
              .where({ id: existingChild.id })
              .del();
          }
        }
      }

      // Return updated member
      return await this.getMemberById(clubId, memberId);
    });
  }


    /**
   * Get all personnel (team managers and staff) for a club
   * @param {number} clubId - Club ID
   * @returns {Promise<array>} - List of personnel
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

  async updateMemberStatus(memberId, updateData, clubId) {
    try {
      const { status, contractEndDate, isActive } = updateData;
      
      console.log('🔍 updateMemberStatus called with:', { memberId, updateData, clubId });
      
      // First, verify the member exists and belongs to the club
      let member = await this.db('user_accounts')
        .where({ id: memberId, club_id: clubId })
        .first();

      console.log('🔍 Member found by id:', member);

      // If not found by id, try by user_id
      if (!member) {
        member = await this.db('user_accounts')
          .where({ user_id: memberId, club_id: clubId })
          .first();
        console.log('🔍 Member found by user_id:', member);
      }

      if (!member) {
        console.log('❌ No member found with id:', memberId, 'in club:', clubId);
        throw new Error('Member not found in your club');
      }

      // Update the member
      const updated = await this.db('user_accounts')
        .where({ id: member.id })
        .update({
          is_active: isActive,
          contract_end_date: contractEndDate,
          updated_at: new Date()
        });

      if (updated === 0) {
        throw new Error('Failed to update member');
      }

      // If deactivating the parent account, remove all their children from teams
      if (!isActive) {
        console.log('🔍 Deactivating parent account, removing children from teams...');
        
        // Get all children of this parent
        const children = await this.db('user_children')
          .where({ parent_user_id: member.user_id })
          .select('id as child_id');
        
        if (children.length > 0) {
          const childIds = children.map(child => child.child_id);
          console.log('🔍 Found children to remove from teams:', childIds);
          
          // Remove all team assignments for these children
          const removedAssignments = await this.db('team_members')
            .whereIn('user_child_id', childIds)
            .del();
          
          console.log('🔍 Removed team assignments:', removedAssignments);
        }
      }

      // Get the updated member data
      const updatedMember = await this.db('user_accounts')
        .select('*')
        .where({ id: member.id })
        .first();

      return {
        success: true,
        member: {
          id: updatedMember.id,
          is_active: updatedMember.is_active,
          contract_end_date: updatedMember.contract_end_date,
          status: status
        }
      };
    } catch (error) {
      console.error('Error updating member status:', error);
      throw new Error('Failed to update member status');
    }
  }
}
