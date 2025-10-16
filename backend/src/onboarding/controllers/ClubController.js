import { OnboardingService, ClubService } from '../services/index.js';

export class ClubController {
  constructor(db) {
    this.onboardingService = new OnboardingService(db);
    this.clubService = new ClubService(db);
  }

  /**
   * POST /api/clubs
   * Create new club
   */
  async createClub(request, reply) {
    try {
      const clubData = request.body;
      const userId = request.user.id;

      // Check if user already has a club as club_manager
      const existingClubs = await this.clubService.getClubsByManager(userId);
      if (existingClubs.length > 0) {
        return reply.code(400).send({
          success: false,
          message: 'User already has a club. Use update endpoint to modify existing club.'
        });
      }

      // Create club and user role/account records in a transaction
      const result = await this.clubService.createClubWithRole(clubData, userId);
      
      reply.code(201).send({
        success: true,
        club: result,
        message: 'Club created successfully'
      });
    } catch (error) {
      request.log.error('Error creating club:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to create club'
      });
    }
  }

  /**
   * GET /api/clubs/:clubId
   * Get club details
   */
  async getClub(request, reply) {
    try {
      const { clubId } = request.params;

      const result = await this.onboardingService.getClub(clubId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting club:', error);
      reply.code(404).send({
        success: false,
        message: 'Club not found'
      });
    }
  }

  /**
   * PUT /api/clubs/:clubId
   * Update club information (club managers only)
   */
  async updateClub(request, reply) {
    try {
      const { clubId } = request.params;
      const updateData = request.body;
      const userId = request.user.id;

      const result = await this.onboardingService.updateClub(clubId, updateData, userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating club:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update club'
      });
    }
  }

  /**
   * GET /api/clubs/my-club
   * Get current user's club (for club managers)
   */
  async getMyClub(request, reply) {
    try {
      const userId = request.user.id;

      const clubs = await this.clubService.getClubsByManager(userId);
      
      if (clubs.length === 0) {
        return reply.code(404).send({
          success: false,
          message: 'No club found for this user'
        });
      }

      reply.code(200).send({
        success: true,
        club: clubs[0], // Return the first (and should be only) club
        message: 'Club retrieved successfully'
      });
    } catch (error) {
      request.log.error('Error getting user club:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get user club'
      });
    }
  }

  /**
   * GET /api/clubs/user/:userId?
   * Get user's clubs
   */
  async getUserClubs(request, reply) {
    try {
      const userId = request.params.userId || request.user.id;

      const result = await this.clubService.getClubsByUser(userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting user clubs:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get user clubs'
      });
    }
  }

  /**
   * GET /api/clubs/search
   * Search clubs
   */
  async searchClubs(request, reply) {
    try {
      const searchParams = request.query;

      const result = await this.clubService.searchClubs(searchParams);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error searching clubs:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to search clubs'
      });
    }
  }

  /**
   * GET /api/clubs/browse
   * Browse clubs by category
   */
  async browseClubs(request, reply) {
    try {
      const { limit } = request.query;

      const result = await this.clubService.browseClubs(parseInt(limit) || 20);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error browsing clubs:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to browse clubs'
      });
    }
  }

  /**
   * POST /api/clubs/:clubId/invite-codes
   * Create invite code for club
   */
  async createInviteCode(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      const options = request.body;

      const result = await this.onboardingService.createInviteCode(clubId, userId, options);
      
      reply.code(201).send({
        success: true,
        inviteCode: result,
        message: 'Invite code created successfully'
      });
    } catch (error) {
      request.log.error('Error creating invite code:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to create invite code'
      });
    }
  }

  /**
   * GET /api/clubs/:clubId/invite-codes
   * Get club invite codes
   */
  async getClubInviteCodes(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;

      const result = await this.onboardingService.getClubInviteCodes(clubId, userId);
      
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error getting club invite codes:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to get invite codes'
      });
    }
  }

  /**
   * DELETE /api/clubs/invite-codes/:codeId
   * Deactivate invite code
   */
  async deactivateInviteCode(request, reply) {
    try {
      const { codeId } = request.params;
      const userId = request.user.id;

      const result = await this.onboardingService.deactivateInviteCode(codeId, userId);
      
      reply.code(200).send({
        success: true,
        message: 'Invite code deactivated successfully'
      });
    } catch (error) {
      request.log.error('Error deactivating invite code:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to deactivate invite code'
      });
    }
  }

  async getMyClubStats(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) return reply.status(404).send({ error: 'No club found for this user' });
      const stats = await this.clubService.getMemberStatsByClub(clubId);
      return reply.send({ success: true, stats });
    } catch (err) {
      return reply.status(500).send({ error: err.message || 'Failed to fetch stats' });
    }
  }

  async getClubStats(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      await this.clubService.assertUserInClub(userId, clubId);
      const stats = await this.clubService.getMemberStatsByClub(clubId);
      return reply.send({ success: true, stats });
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message || 'Failed to fetch stats' });
    }
  }

  async getMyClubMembers(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user. Please create a club first before adding members.',
          message: 'You need to set up your club before you can add members. Please go to the Club Setup page to create your club.',
          action: 'create_club'
        });
      }
      const members = await this.clubService.listMembersByClub(clubId);
      return reply.send({ success: true, members });
    } catch (err) {
      request.log.error('Error fetching my club members:', err);
      return reply.status(500).send({ error: err.message || 'Failed to fetch members' });
    }
  }

  async getMembersByClub(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      await this.clubService.assertUserInClub(userId, clubId);
      const members = await this.clubService.listMembersByClub(clubId);
      return reply.send({ success: true, members });
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message || 'Failed to fetch members' });
    }
  }

  async createMyClubMember(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user. Please create a club first before adding members.',
          message: 'You need to set up your club before you can add members. Please go to the Club Setup page to create your club.',
          action: 'create_club'
        });
      }
      const result = await this.clubService.createParentAndChildren(clubId, request.body);
      return reply.code(201).send(result);
    } catch (err) {
      const status = err.statusCode || 400;
      return reply.status(status).send({ error: err.message || 'Failed to create member' });
    }
  }

  async createClubMember(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      await this.clubService.assertUserInClub(userId, clubId);
      const result = await this.clubService.createParentAndChildren(clubId, request.body);
      return reply.code(201).send(result);
    } catch (err) {
      const status = err.statusCode || 400;
      return reply.status(status).send({ error: err.message || 'Failed to create member' });
    }
  }

  /**
   * GET /api/clubs/my-club/members/:memberId
   * Get a specific member by ID
   */
  async getMyClubMemberById(request, reply) {
    try {
      const { memberId } = request.params;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user'
        });
      }
      const member = await this.clubService.getMemberById(clubId, parseInt(memberId));
      return reply.send({ success: true, member });
    } catch (err) {
      const status = err.statusCode || 500;
      return reply.status(status).send({ error: err.message || 'Failed to fetch member' });
    }
  }

  /**
   * PUT /api/clubs/my-club/members/:memberId
   * Update a specific member
   */
  async updateMyClubMember(request, reply) {
    try {
      const { memberId } = request.params;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) {
        return reply.status(404).send({
          error: 'No club found for this user'
        });
      }
      const result = await this.clubService.updateMember(clubId, parseInt(memberId), request.body);
      return reply.send({ success: true, member: result });
    } catch (err) {
      const status = err.statusCode || 400;
      return reply.status(status).send({ error: err.message || 'Failed to update member' });
    }
  }

  /**
   * Personnel Management
   */

  /**
   * GET /api/clubs/:clubId/personnel
   * Get club personnel (users with club_coach role)
   */
  async getClubPersonnel(request, reply) {
    try {
      const { clubId } = request.params;
      const personnel = await this.clubService.getClubPersonnel(parseInt(clubId));
      
      reply.send({
        success: true,
        data: personnel
      });
    } catch (error) {
      request.log.error('Error getting club personnel:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to get club personnel'
      });
    }
  }

  /**
   * POST /api/clubs/:clubId/personnel
   * Add personnel to club
   */
  async addPersonnelToClub(request, reply) {
    try {
      const { clubId } = request.params;
      const personnelData = request.body;

      // Validate required fields
      if (!personnelData.email || !personnelData.firstName || !personnelData.lastName) {
        return reply.code(400).send({
          success: false,
          message: 'Email, firstName, and lastName are required'
        });
      }

      const personnel = await this.clubService.addPersonnelToClub(parseInt(clubId), personnelData);
      
      reply.code(201).send({
        success: true,
        message: 'Personnel added to club successfully',
        data: personnel
      });
    } catch (error) {
      request.log.error('Error adding personnel to club:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to add personnel to club'
      });
    }
  }

  /**
   * PUT /api/clubs/personnel/:userRoleId
   * Update personnel record
   */
  async updatePersonnel(request, reply) {
    try {
      const { userRoleId } = request.params;
      const updateData = request.body;

      const personnel = await this.clubService.updatePersonnel(parseInt(userRoleId), updateData);
      
      reply.send({
        success: true,
        message: 'Personnel updated successfully',
        data: personnel
      });
    } catch (error) {
      request.log.error('Error updating personnel:', error);
      if (error.message === 'Personnel record not found') {
        return reply.code(404).send({
          success: false,
          message: 'Personnel record not found'
        });
      }
      
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to update personnel'
      });
    }
  }

  /**
   * DELETE /api/clubs/personnel/:userRoleId
   * Remove personnel from club
   */
  async removePersonnelFromClub(request, reply) {
    try {
      const { userRoleId } = request.params;
      const result = await this.clubService.removePersonnelFromClub(parseInt(userRoleId));
      
      reply.send({
        success: true,
        message: result.message
      });
    } catch (error) {
      request.log.error('Error removing personnel from club:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to remove personnel from club'
      });
    }
  }
}
