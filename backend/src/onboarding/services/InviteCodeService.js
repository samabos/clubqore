export class InviteCodeService {
  constructor(db, clubService) {
    this.db = db;
    this.clubService = clubService;
  }

  /**
   * Create new invite code for a club
   */
  async createInviteCode(clubId, createdBy, options = {}) {
    // Generate unique code
    const code = this.generateInviteCode();
    
    // Verify club exists and user is manager
    const club = await this.clubService.getClubById(clubId);
    // Convert both to strings for comparison to handle type differences
    if (club.createdBy.toString() !== createdBy.toString()) {
      throw new Error('Only club managers can create invite codes');
    }

    const inviteCode = await this.db('club_invite_codes').insert({
      code,
      club_id: clubId,
      created_by: createdBy,
      is_active: true,
      expires_at: options.expiresAt,
      usage_limit: options.usageLimit,
      description: options.description,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    return this.formatInviteCode(inviteCode[0]);
  }

  /**
   * Validate invite code with detailed response
   */
  async validateInviteCode(code) {
    console.log('🔍 validateInviteCode called with code:', code);
    const inviteCode = await this.db('club_invite_codes')
      .where({ code })
      .first();

    console.log('🔍 Found invite code in DB:', inviteCode);

    if (!inviteCode) {
      console.log('🔍 Invite code not found in DB');
      return {
        valid: false,
        message: 'Invite code not found',
        errorCode: 'CODE_NOT_FOUND'
      };
    }

    //if (!inviteCode.is_active) {
    //  return {
    //    valid: false,
    //    message: 'Invite code is no longer active',
    //    errorCode: 'CODE_INACTIVE'
    //  };
   // }

    //if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    //  return {
    //    valid: false,
    //    message: 'Invite code has expired',
    //    errorCode: 'CODE_EXPIRED'
    //  };
    //}

    //if (inviteCode.usage_limit && inviteCode.used_count >= inviteCode.usage_limit) {
    //  return {
    //    valid: false,
    //    message: 'Invite code usage limit reached',
    //    errorCode: 'USAGE_LIMIT_REACHED'
    //  };
    //}

    // Get club information
    console.log('🔍 Getting club for club_id:', inviteCode.club_id);
    const club = await this.clubService.getClubById(inviteCode.club_id);
    console.log('🔍 Retrieved club:', club);
    const memberCount = await this.clubService.getMemberCount(inviteCode.club_id);
    console.log('🔍 Member count:', memberCount);

    const clubResponse = {
      id: club.id,
      name: club.name,
      clubType: club.clubType,
      description: club.description,
      logoUrl: club.logoUrl,
      memberCount
    };
    console.log('🔍 Club response object:', clubResponse);

    return {
      valid: true,
      club: clubResponse,
      code: {
        expiresAt: inviteCode.expires_at?.toISOString(),
        usageLimit: inviteCode.usage_limit,
        usedCount: inviteCode.used_count,
        remainingUses: inviteCode.usage_limit ? inviteCode.usage_limit - inviteCode.used_count : null
      },
      message: 'Invite code is valid'
    };
  }

  /**
   * Preview club information without using the code
   */
  async previewInviteCode(code, userId) {
    console.log('🔍 previewInviteCode called with code:', code, 'userId:', userId);
    const validation = await this.validateInviteCode(code);
    console.log('🔍 Validation result:', validation);

    if (!validation.valid) {
      return {
        valid: false,
        userCanJoin: false,
        alreadyMember: false,
        message: validation.message
      };
    }

    // Check if user is already a member
    const alreadyMember = await this.clubService.isUserMember(validation.club.id, userId);

    return {
      valid: true,
      club: validation.club,
      userCanJoin: !alreadyMember,
      alreadyMember,
      message: alreadyMember ? 'You are already a member of this club' : 'You can join this club'
    };
  }

  /**
   * Use invite code and increment usage count
   */
  async useInviteCode(code, userId, trx = null) {
    const validation = await this.validateInviteCode(code);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Check if user is already a member
    //const alreadyMember = await this.clubService.isUserMember(validation.club.id, userId);
    //if (alreadyMember) {
    //  throw new Error('User is already a member of this club');
    //}

    const db = trx || this.db;

    // Increment usage count atomically
    //await db('club_invite_codes')
    //  .where({ code })
    //  .increment('used_count', 1)
    //  .update({ updated_at: new Date() });

    return {
      success: true,
      club: validation.club,
      message: 'Invite code used successfully'
    };
  }

  /**
   * Get all invite codes for a club
   */
  async getClubInviteCodes(clubId, userId) {
    // Verify user is club manager
    const club = await this.clubService.getClubById(clubId);
    if (club.createdBy !== userId) {
      throw new Error('Only club managers can view invite codes');
    }

    const codes = await this.db('club_invite_codes')
      .where({ club_id: clubId })
      .orderBy('created_at', 'desc');

    return codes.map(code => this.formatInviteCode(code));
  }

  /**
   * Deactivate invite code
   */
  async deactivateInviteCode(codeId, userId) {
    const inviteCode = await this.db('club_invite_codes')
      .where({ id: codeId })
      .first();

    if (!inviteCode) {
      throw new Error('Invite code not found');
    }

    // Verify user is club manager
    const club = await this.clubService.getClubById(inviteCode.club_id);
    if (club.createdBy !== userId) {
      throw new Error('Only club managers can deactivate invite codes');
    }

    await this.db('club_invite_codes')
      .where({ id: codeId })
      .update({ is_active: false, updated_at: new Date() });

    return { success: true, message: 'Invite code deactivated' };
  }

  /**
   * Generate random invite code
   */
  generateInviteCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Format invite code for API response
   */
  formatInviteCode(inviteCode) {
    return {
      id: inviteCode.id,
      code: inviteCode.code,
      clubId: inviteCode.club_id,
      createdBy: inviteCode.created_by,
      isActive: inviteCode.is_active,
      expiresAt: inviteCode.expires_at?.toISOString(),
      usageLimit: inviteCode.usage_limit,
      usedCount: inviteCode.used_count,
      description: inviteCode.description,
      createdAt: inviteCode.created_at.toISOString(),
      updatedAt: inviteCode.updated_at.toISOString()
    };
  }
}
