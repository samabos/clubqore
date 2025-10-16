import { UserCreationUtils, ProfileUtils, AccountUtils, ValidationUtils, ChildUtils } from '../utils/index.js';

export class ClubService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create new club (during club manager onboarding)
   */
  async createClub(clubData, createdBy, trx = null) {
    const db = trx || this.db;
    
    const club = await db('clubs').insert({
      name: clubData.name,
      club_type: clubData.clubType || clubData.type,
      description: clubData.description || null,
      founded_year: clubData.foundedYear || null,
      membership_capacity: clubData.membershipCapacity || null,
      website: clubData.website || null,
      address: clubData.address || null,
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

      // 2. Generate unique account number
      // const { AccountNumberService } = await import('./AccountNumberService.js');
      // const accountNumberService = new AccountNumberService(this.db);
      // const accountNumber = await accountNumberService.generateAccountNumber(trx);

      // 3. Create user_roles record
      console.log(`Creating user_roles record for user ${createdBy}, club ${clubId}`);
      await trx('user_roles').insert({
        user_id: createdBy,
        role: 'club_manager',
        club_id: clubId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      // 4. Create user_accounts record
      // console.log(`Creating user_accounts record for user ${createdBy}, club ${clubId}, account ${accountNumber}`);
      // await trx('user_accounts').insert({
      //   user_id: createdBy,
      //   account_number: accountNumber,
      //   role: 'club_manager',
      //   club_id: clubId,
      //   is_active: true,
      //   onboarding_completed_at: new Date(),
      //   created_at: new Date(),
      //   updated_at: new Date()
      // });

      // 5. Update user's primary role and onboarding status
      console.log(`Updating user ${createdBy} primary role to club_manager`);
      await trx('users')
        .where({ id: createdBy })
        .update({
          primary_role: 'club_manager',
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

    const updateFields = {
      name: updateData.name,
      club_type: updateData.clubType,
      description: updateData.description,
      founded_year: updateData.foundedYear,
      membership_capacity: updateData.membershipCapacity,
      website: updateData.website,
      address: updateData.address,
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
    return {
      id: club.id.toString(),
      name: club.name,
      clubType: club.club_type,
      category: club.club_type,  // Add category alias for backward compatibility
      description: club.description,
      foundedYear: club.founded_year,
      membershipCapacity: club.membership_capacity,
      website: club.website,
      address: club.address,
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
    const role = await this.db('user_roles')
      .select('club_id')
      .where({ user_id: userId, role: 'club_manager', is_active: true })
      .first();
    if (role?.club_id) return role.club_id;

    const user = await this.db('users')
      .select('primary_role', 'is_onboarded')
      .where({ id: userId })
      .first();
    if (user?.primary_role === 'club_manager' && user?.is_onboarded) {
      const account = await this.db('user_accounts')
        .select('club_id')
        .where({ user_id: userId, role: 'club_manager', is_active: true })
        .first();
      if (account?.club_id) return account.club_id;
    }
    return null;
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
      .where({ 'ua.club_id': clubId, 'ua.is_active': true })
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
      .select([
        'uc.parent_user_id',
        'uc.child_user_id',
        'uc.relationship',
        'uc.club_id',
        'uc.membership_code',
        'cup.position as child_position',
        'cup.first_name as child_first_name',
        'cup.last_name as child_last_name',
        'cup.date_of_birth as child_date_of_birth',
        'cup.avatar as child_avatar',
        this.db.raw('COALESCE(pup.first_name, \'\') as parent_first_name'),
        this.db.raw('COALESCE(pup.last_name, \'\') as parent_last_name')
      ]);

    // map relations
    const userIdToRelations = new Map();
    for (const rel of children) {
      if (!userIdToRelations.has(rel.parent_user_id)) userIdToRelations.set(rel.parent_user_id, { children: [] });
      
      // Include children (all children now have user accounts due to schema change)
      if (rel.child_user_id && rel.child_first_name && rel.child_last_name) {
        userIdToRelations.get(rel.parent_user_id).children.push({
          userId: rel.child_user_id,
          firstName: rel.child_first_name,
          lastName: rel.child_last_name,
          dateOfBirth: rel.child_date_of_birth,
          relationship: rel.relationship,
          position: rel.child_position || null,
          isRegistered: true, // All children now have user accounts
          clubId: rel.club_id,
          membershipCode: rel.membership_code,
          avatar: rel.child_avatar
        });
      }
    }

    return members.map((m) => {
      const rel = userIdToRelations.get(m.user_id) || { children: [] };
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
        parents: [], // Parents not implemented yet
        hasChildren: rel.children.length > 0,
        hasParents: false
      };
    });
  }

  async createParentAndChildren(clubId, memberData) {
    ValidationUtils.validateUserData(memberData);

    return await this.db.transaction(async (trx) => {
      // Create parent user
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
          relationship: 'parent',
          club_id: clubId,
          created_at: new Date(),
          updated_at: new Date()
        });

        createdChildren.push({ id: childUser.id });
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
                  relationship: child.relationship || 'parent',
                  club_id: child.clubId || clubId,
                  membership_code: child.membershipCode || null,
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
                relationship: child.relationship || 'parent',
                clubId: clubId, // Use the clubId from the method parameter
                membershipCode: child.membershipCode || null
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
   * Get club personnel (users with club_coach role for a specific club)
   */
  async getClubPersonnel(clubId) {
    try {
      const personnel = await this.db('user_roles')
        .join('users', 'user_roles.user_id', 'users.id')
        .leftJoin('user_profiles', 'user_roles.user_id', 'user_profiles.user_id')
        .where('user_roles.club_id', clubId)
        .where('user_roles.role', 'club_coach')
        .where('user_roles.is_active', true)
        .select(
          'user_roles.id as user_role_id',
          'user_roles.user_id',
          'user_roles.role',
          'user_roles.club_id',
          'user_roles.created_at as role_created_at',
          'users.email',
          'users.is_onboarded',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'user_profiles.phone',
          'user_profiles.avatar'
        )
        .orderBy('user_profiles.first_name', 'asc');

      return personnel.map(person => ({
        userRoleId: person.user_role_id,
        userId: person.user_id,
        role: person.role,
        clubId: person.club_id,
        email: person.email,
        firstName: person.first_name,
        lastName: person.last_name,
        fullName: person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : null,
        phone: person.phone,
        avatar: person.avatar,
        isOnboarded: person.is_onboarded,
        roleCreatedAt: person.role_created_at?.toISOString()
      }));
    } catch (error) {
      console.error('Error getting club personnel:', error);
      throw error;
    }
  }

  /**
   * Add personnel to club (create user_role and user_profile)
   */
  async addPersonnelToClub(clubId, personnelData) {
    try {
      return await this.db.transaction(async (trx) => {
        // 1. Create or get user
        let userId;
        const existingUser = await trx('users')
          .where({ email: personnelData.email })
          .first();

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create new user
          const [newUserId] = await trx('users').insert({
            email: personnelData.email,
            password: personnelData.password || 'temp_password_123', // Should be changed on first login
            is_onboarded: false,
            email_verified: false,
            created_at: new Date(),
            updated_at: new Date()
          });
          userId = newUserId;
        }

        // 2. Create user profile
        await trx('user_profiles').insert({
          user_id: userId,
          first_name: personnelData.firstName,
          last_name: personnelData.lastName,
          phone: personnelData.phone || null,
          avatar: personnelData.avatar || null,
          created_at: new Date(),
          updated_at: new Date()
        }).onConflict('user_id').merge();

        // 3. Create user role
        await trx('user_roles').insert({
          user_id: userId,
          role: 'club_coach',
          club_id: clubId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });

        // 4. Return the created personnel record
        const personnel = await this.getClubPersonnel(clubId);
        return personnel.find(p => p.userId === userId);
      });
    } catch (error) {
      console.error('Error adding personnel to club:', error);
      throw error;
    }
  }

  /**
   * Update personnel record
   */
  async updatePersonnel(userRoleId, updateData) {
    try {
      return await this.db.transaction(async (trx) => {
        // Get the user_role record to find the user_id
        const userRole = await trx('user_roles')
          .where({ id: userRoleId })
          .first();

        if (!userRole) {
          throw new Error('Personnel record not found');
        }

        // Update user profile if profile data is provided
        if (updateData.firstName || updateData.lastName || updateData.phone || updateData.avatar) {
          const profileUpdate = {
            updated_at: new Date()
          };

          if (updateData.firstName) profileUpdate.first_name = updateData.firstName;
          if (updateData.lastName) profileUpdate.last_name = updateData.lastName;
          if (updateData.phone !== undefined) profileUpdate.phone = updateData.phone;
          if (updateData.avatar !== undefined) profileUpdate.avatar = updateData.avatar;

          await trx('user_profiles')
            .where({ user_id: userRole.user_id })
            .update(profileUpdate);
        }

        // Update user role if role data is provided
        if (updateData.isActive !== undefined) {
          await trx('user_roles')
            .where({ id: userRoleId })
            .update({
              is_active: updateData.isActive,
              updated_at: new Date()
            });
        }

        // Return updated personnel record
        const personnel = await this.getClubPersonnel(userRole.club_id);
        return personnel.find(p => p.userRoleId === userRoleId);
      });
    } catch (error) {
      console.error('Error updating personnel:', error);
      throw error;
    }
  }

  /**
   * Remove personnel from club (deactivate user_role)
   */
  async removePersonnelFromClub(userRoleId) {
    try {
      const result = await this.db('user_roles')
        .where({ id: userRoleId })
        .update({
          is_active: false,
          updated_at: new Date()
        });

      return { success: true, message: 'Personnel removed from club successfully' };
    } catch (error) {
      console.error('Error removing personnel from club:', error);
      throw error;
    }
  }
}
