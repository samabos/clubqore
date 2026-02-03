import crypto from 'crypto';
import { emailService } from '../../services/emailService.js';

/**
 * ParentInviteService
 *
 * Handles parent invitation creation, validation, and registration completion.
 * Uses the club_invites table with invite_type='parent' for single-use email invites.
 *
 * This is separate from club_invite_codes which handles generic multi-use club invites.
 */
export class ParentInviteService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Generate a secure random invite code
   * Format: PARENT-XXXXXXXX (8 random characters)
   */
  generateInviteCode() {
    const randomBytes = crypto.randomBytes(6);
    const code = randomBytes.toString('base64url').substring(0, 8).toUpperCase();
    return `PARENT-${code}`;
  }

  /**
   * Create a parent invite
   *
   * @param {number} clubId - The club ID
   * @param {number} invitedBy - User ID of club manager creating the invite
   * @param {string} inviteeEmail - Email of the parent being invited
   * @param {string} [inviteeFirstName] - Optional first name
   * @param {string} [inviteeLastName] - Optional last name
   * @returns {Promise<object>} The created invite
   */
  async createParentInvite(clubId, invitedBy, inviteeEmail, inviteeFirstName = null, inviteeLastName = null) {
    // Verify club exists
    const club = await this.db('clubs').where({ id: clubId }).first();
    if (!club) {
      throw new Error('Club not found');
    }

    // Check if parent already has an active invite
    const existingInvite = await this.db('club_invites')
      .where({
        club_id: clubId,
        invite_type: 'parent',
        invitee_email: inviteeEmail.toLowerCase(),
        is_used: false
      })
      .where('expires_at', '>', new Date())
      .first();

    if (existingInvite) {
      throw new Error('An active invite already exists for this email address');
    }

    // Check if user with this email already exists
    const existingUser = await this.db('users').where({ email: inviteeEmail.toLowerCase() }).first();
    if (existingUser) {
      throw new Error('A user with this email address already exists');
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      inviteCode = this.generateInviteCode();
      const existing = await this.db('club_invites').where({ invite_code: inviteCode }).first();
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique invite code');
    }

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invite
    const [invite] = await this.db('club_invites')
      .insert({
        invite_code: inviteCode,
        invite_type: 'parent',
        club_id: clubId,
        invited_by: invitedBy,
        invitee_email: inviteeEmail.toLowerCase(),
        invitee_first_name: inviteeFirstName,
        invitee_last_name: inviteeLastName,
        is_used: false,
        expires_at: expiresAt,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    // Send invite email
    await this.sendInviteEmail(invite, club);

    return this.formatInvite(invite);
  }

  /**
   * Send invite email to parent
   */
  async sendInviteEmail(invite, club) {
    // Get club manager details
    const manager = await this.db('users').where({ id: invite.invited_by }).first();
    const managerName = manager?.name || 'Club Manager';

    // Get frontend URL from environment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const registrationUrl = `${frontendUrl}/register/parent/${invite.invite_code}`;

    // Build email data
    const emailData = {
      inviteCode: invite.invite_code,
      inviteeName: invite.invitee_first_name || '',
      managerName: managerName,
      clubName: club.name,
      registrationUrl: registrationUrl
    };

    // Send parent invite email
    await emailService.sendParentInvite(
      invite.invitee_email,
      emailData
    );
  }

  /**
   * Validate an invite code
   *
   * @param {string} inviteCode - The invite code to validate
   * @returns {Promise<object>} Validation result with invite details
   */
  async validateInvite(inviteCode) {
    const invite = await this.db('club_invites')
      .where({ invite_code: inviteCode, invite_type: 'parent' })
      .first();

    if (!invite) {
      return {
        valid: false,
        message: 'Invalid invite code',
        errorCode: 'INVALID_CODE'
      };
    }

    if (invite.is_used) {
      return {
        valid: false,
        message: 'This invite has already been used',
        errorCode: 'ALREADY_USED'
      };
    }

    if (new Date(invite.expires_at) < new Date()) {
      return {
        valid: false,
        message: 'This invite has expired',
        errorCode: 'EXPIRED'
      };
    }

    // Get club information
    const club = await this.db('clubs').where({ id: invite.club_id }).first();

    return {
      valid: true,
      invite: this.formatInvite(invite),
      club: {
        id: club.id,
        name: club.name,
        clubType: club.club_type
      }
    };
  }

  /**
   * Get invite details for registration page preview
   * (Same as validateInvite but with a clearer name)
   */
  async getInviteDetails(inviteCode) {
    return this.validateInvite(inviteCode);
  }

  /**
   * Mark an invite as used
   * Called after successful registration
   */
  async markInviteAsUsed(inviteCode, userId) {
    await this.db('club_invites')
      .where({ invite_code: inviteCode })
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date(),
        updated_at: new Date()
      });
  }

  /**
   * Get all invites for a club (for club manager view)
   */
  async getClubInvites(clubId, filters = {}) {
    let query = this.db('club_invites')
      .where({ club_id: clubId, invite_type: 'parent' })
      .orderBy('created_at', 'desc');

    // Apply filters
    if (filters.status === 'active') {
      query = query
        .where({ is_used: false })
        .where('expires_at', '>', new Date());
    } else if (filters.status === 'used') {
      query = query.where({ is_used: true });
    } else if (filters.status === 'expired') {
      query = query
        .where({ is_used: false })
        .where('expires_at', '<=', new Date());
    }

    const invites = await query;

    return invites.map(invite => this.formatInvite(invite));
  }

  /**
   * Cancel/delete an invite (before it's used)
   */
  async cancelInvite(inviteCode, clubId) {
    const invite = await this.db('club_invites')
      .where({ invite_code: inviteCode, club_id: clubId, invite_type: 'parent' })
      .first();

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.is_used) {
      throw new Error('Cannot cancel an invite that has already been used');
    }

    await this.db('club_invites').where({ id: invite.id }).delete();

    return { success: true, message: 'Invite cancelled successfully' };
  }

  /**
   * Resend invite email
   */
  async resendInvite(inviteCode, clubId) {
    const invite = await this.db('club_invites')
      .where({ invite_code: inviteCode, club_id: clubId, invite_type: 'parent' })
      .first();

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.is_used) {
      throw new Error('Cannot resend an invite that has already been used');
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Cannot resend an expired invite');
    }

    // Get club details
    const club = await this.db('clubs').where({ id: clubId }).first();

    // Resend email
    await this.sendInviteEmail(invite, club);

    return { success: true, message: 'Invite email resent successfully' };
  }

  /**
   * Format invite for API response
   */
  formatInvite(invite) {
    return {
      id: invite.id,
      inviteCode: invite.invite_code,
      clubId: invite.club_id,
      invitedBy: invite.invited_by,
      inviteeEmail: invite.invitee_email,
      inviteeFirstName: invite.invitee_first_name,
      inviteeLastName: invite.invitee_last_name,
      isUsed: invite.is_used,
      usedBy: invite.used_by,
      usedAt: invite.used_at,
      expiresAt: invite.expires_at,
      createdAt: invite.created_at
    };
  }
}
