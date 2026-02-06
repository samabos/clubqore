import { ParentInviteService } from '../services/ParentInviteService.js';
import { MemberService } from '../../member/services/MemberService.js';

/**
 * ParentInviteController
 *
 * Handles HTTP requests for parent invite functionality
 */
export class ParentInviteController {
  constructor(db) {
    this.db = db;
    this.parentInviteService = new ParentInviteService(db);
    this.memberService = new MemberService(db);
  }

  /**
   * POST /api/parent-invites
   * Create a new parent invite (protected - club manager only)
   */
  async createInvite(request, reply) {
    try {
      const { clubId, inviteeEmail, inviteeFirstName, inviteeLastName } = request.body;
      const userId = request.user.id;

      // Validate required fields
      if (!clubId || !inviteeEmail) {
        return reply.code(400).send({
          error: 'Club ID and invitee email are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteeEmail)) {
        return reply.code(400).send({
          error: 'Invalid email address'
        });
      }

      // Verify user is a club manager for this club
      const club = await this.db('clubs').where({ id: clubId }).first();
      if (!club) {
        return reply.code(404).send({ error: 'Club not found' });
      }

      if (club.created_by !== userId) {
        return reply.code(403).send({
          error: 'Only club managers can create parent invites'
        });
      }

      const invite = await this.parentInviteService.createParentInvite(
        clubId,
        userId,
        inviteeEmail,
        inviteeFirstName,
        inviteeLastName
      );

      return reply.code(201).send({
        success: true,
        invite
      });
    } catch (error) {
      console.error('Error creating parent invite:', error);

      if (error.message.includes('already exists')) {
        return reply.code(409).send({ error: error.message });
      }

      return reply.code(500).send({
        error: error.message || 'Failed to create parent invite'
      });
    }
  }

  /**
   * GET /api/parent-invites/:inviteCode/validate
   * Validate an invite code (public)
   */
  async validateInvite(request, reply) {
    try {
      const { inviteCode } = request.params;

      const result = await this.parentInviteService.validateInvite(inviteCode);

      if (!result.valid) {
        return reply.code(400).send(result);
      }

      return reply.code(200).send(result);
    } catch (error) {
      console.error('Error validating invite:', error);
      return reply.code(500).send({
        error: 'Failed to validate invite code'
      });
    }
  }

  /**
   * GET /api/parent-invites/:inviteCode
   * Get invite details for registration page (public)
   */
  async getInviteDetails(request, reply) {
    try {
      const { inviteCode } = request.params;

      const result = await this.parentInviteService.getInviteDetails(inviteCode);

      if (!result.valid) {
        return reply.code(400).send(result);
      }

      return reply.code(200).send(result);
    } catch (error) {
      console.error('Error getting invite details:', error);
      return reply.code(500).send({
        error: 'Failed to get invite details'
      });
    }
  }

  /**
   * POST /api/parent-invites/:inviteCode/complete
   * Complete registration using an invite code (public)
   */
  async completeRegistration(request, reply) {
    try {
      const { inviteCode } = request.params;
      const registrationData = request.body;

      // Validate invite first
      const validation = await this.parentInviteService.validateInvite(inviteCode);
      if (!validation.valid) {
        return reply.code(400).send({
          error: validation.message,
          errorCode: validation.errorCode
        });
      }

      const { invite, club } = validation;

      // Verify email matches
      if (registrationData.parent.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
        return reply.code(400).send({
          error: 'Email does not match the invitation'
        });
      }

      // Create parent and children using MemberService
      // Flatten the data structure to match what MemberService expects
      const memberData = {
        email: registrationData.parent.email,
        password: registrationData.account.password,
        firstName: registrationData.parent.firstName,
        lastName: registrationData.parent.lastName,
        phone: registrationData.parent.phone,
        address: registrationData.parent.address,
        generatePassword: false,
        children: registrationData.children || []
      };

      // Create parent and children accounts
      const result = await this.memberService.createParentAndChildren(club.id, memberData);

      // Mark invite as used
      await this.parentInviteService.markInviteAsUsed(inviteCode, result.member.id);

      return reply.code(201).send({
        success: true,
        message: 'Registration completed successfully',
        userId: result.member.id,
        accountNumber: result.member.accountNumber
      });
    } catch (error) {
      console.error('Error completing registration:', error);

      if (error.message.includes('already exists')) {
        return reply.code(409).send({ error: error.message });
      }

      return reply.code(500).send({
        error: error.message || 'Failed to complete registration'
      });
    }
  }

  /**
   * GET /api/clubs/:clubId/parent-invites
   * Get all parent invites for a club (protected - club manager only)
   */
  async getClubInvites(request, reply) {
    try {
      const { clubId } = request.params;
      const { status } = request.query;
      const userId = request.user.id;

      // Verify user is a club manager for this club
      const club = await this.db('clubs').where({ id: clubId }).first();
      if (!club) {
        return reply.code(404).send({ error: 'Club not found' });
      }

      if (club.created_by !== userId) {
        return reply.code(403).send({
          error: 'Only club managers can view parent invites'
        });
      }

      const invites = await this.parentInviteService.getClubInvites(
        parseInt(clubId),
        { status }
      );

      return reply.code(200).send({
        invites
      });
    } catch (error) {
      console.error('Error getting club invites:', error);
      return reply.code(500).send({
        error: 'Failed to get club invites'
      });
    }
  }

  /**
   * DELETE /api/parent-invites/:inviteCode
   * Cancel an invite (protected - club manager only)
   */
  async cancelInvite(request, reply) {
    try {
      const { inviteCode } = request.params;
      const { clubId } = request.body;
      const userId = request.user.id;

      // Verify user is a club manager for this club
      const club = await this.db('clubs').where({ id: clubId }).first();
      if (!club) {
        return reply.code(404).send({ error: 'Club not found' });
      }

      if (club.created_by !== userId) {
        return reply.code(403).send({
          error: 'Only club managers can cancel invites'
        });
      }

      const result = await this.parentInviteService.cancelInvite(inviteCode, clubId);

      return reply.code(200).send(result);
    } catch (error) {
      console.error('Error cancelling invite:', error);

      if (error.message.includes('not found')) {
        return reply.code(404).send({ error: error.message });
      }

      if (error.message.includes('already been used')) {
        return reply.code(400).send({ error: error.message });
      }

      return reply.code(500).send({
        error: 'Failed to cancel invite'
      });
    }
  }

  /**
   * POST /api/parent-invites/:inviteCode/resend
   * Resend an invite email (protected - club manager only)
   */
  async resendInvite(request, reply) {
    try {
      const { inviteCode } = request.params;
      const { clubId } = request.body;
      const userId = request.user.id;

      // Verify user is a club manager for this club
      const club = await this.db('clubs').where({ id: clubId }).first();
      if (!club) {
        return reply.code(404).send({ error: 'Club not found' });
      }

      if (club.created_by !== userId) {
        return reply.code(403).send({
          error: 'Only club managers can resend invites'
        });
      }

      const result = await this.parentInviteService.resendInvite(inviteCode, clubId);

      return reply.code(200).send(result);
    } catch (error) {
      console.error('Error resending invite:', error);

      if (error.message.includes('not found')) {
        return reply.code(404).send({ error: error.message });
      }

      if (error.message.includes('already been used') || error.message.includes('expired')) {
        return reply.code(400).send({ error: error.message });
      }

      return reply.code(500).send({
        error: 'Failed to resend invite'
      });
    }
  }
}
