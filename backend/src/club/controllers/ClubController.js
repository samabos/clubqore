import { ClubService } from '../services/ClubService.js';
import { MemberService } from '../services/MemberService.js';

export class ClubController {
  constructor(db) {
    this.db = db;
    this.clubService = new ClubService(db);
    this.memberService = new MemberService(db);
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

      const club = await this.clubService.getClubById(clubId);

      reply.code(200).send({ club });
    } catch (error) {
      request.log.error('Error getting club:', error);
      reply.code(404).send({
        success: false,
        message: 'Club not found'
      });
    }
  }

  // Moved email availability to src/auth

  /**
   * PUT /api/clubs/:clubId
   * Update club information (club managers only)
   */
  async updateClub(request, reply) {
    try {
      const { clubId } = request.params;
      const updateData = request.body;
      const userId = request.user.id;

      const club = await this.clubService.updateClub(clubId, updateData, userId);

      reply.code(200).send({
        success: true,
        club,
        message: 'Club updated successfully'
      });
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

  async getMyClubStats(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);
      if (!clubId) return reply.status(404).send({ error: 'No club found for this user' });
      const stats = await this.memberService.getMemberStatsByClub(clubId);
      return reply.send({ success: true, stats });
    } catch (err) {
      return reply.status(500).send({ error: err.message || 'Failed to fetch stats' });
    }
  }

  async getClubStats(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      await this.memberService.assertUserInClub(userId, clubId);
      const stats = await this.memberService.getMemberStatsByClub(clubId);
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
      const members = await this.memberService.listMembersByClub(clubId);
      return reply.send({ success: true, data: members });
    } catch (err) {
      request.log.error('Error fetching my club members:', err);
      return reply.status(500).send({ error: err.message || 'Failed to fetch members' });
    }
  }

  async getMembersByClub(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      await this.memberService.assertUserInClub(userId, clubId);
      const members = await this.memberService.listMembersByClub(clubId);
      return reply.send({ success: true, data: members });
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
      const result = await this.memberService.createParentAndChildren(clubId, request.body);
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
      await this.memberService.assertUserInClub(userId, clubId);
      const result = await this.memberService.createParentAndChildren(clubId, request.body);
      return reply.code(201).send(result);
    } catch (err) {
      const status = err.statusCode || 400;
      return reply.status(status).send({ error: err.message || 'Failed to create member' });
    }
  }

  /**
   * POST /api/clubs/:clubId/logo
   * Upload club logo (base64 data)
   */
  async uploadClubLogo(request, reply) {
    try {
      const clubId = parseInt(request.params.clubId);
      const { logoData } = request.body;

      if (!logoData) {
        return reply.code(400).send({
          success: false,
          message: 'Logo data is required'
        });
      }

      // Validate base64 data format
      if (!logoData.startsWith('data:image/')) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid logo format. Expected base64 image data.'
        });
      }

      // Check file size (limit to 2MB for base64)
      const base64Size = (logoData.length * 3) / 4;
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (base64Size > maxSize) {
        return reply.code(400).send({
          success: false,
          message: 'Logo file too large. Maximum size is 2MB.'
        });
      }

      const result = await this.clubService.uploadClubLogo(clubId, logoData);

      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error uploading club logo:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to upload club logo'
      });
    }
  }
}
