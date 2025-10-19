import { TeamManagerService } from '../services/TeamManagerService.js';

export class TeamManagerController {
  constructor(db) {
    this.teamManagerService = new TeamManagerService(db);
  }

  /**
   * POST /api/clubs/:clubId/team-managers
   * Create new team manager (coach) account
   */
  async createTeamManager(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;
      const teamManagerData = request.body;

      const result = await this.teamManagerService.createTeamManager(
        parseInt(clubId),
        userId,
        teamManagerData
      );

      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error creating team manager:', error);
      
      // Handle specific error types
      if (error.message.includes('UNAUTHORIZED_CLUB_ACCESS')) {
        return reply.code(403).send({
          success: false,
          message: 'You are not authorized to create team managers for this club'
        });
      }
      
      if (error.message.includes('CLUB_NOT_FOUND')) {
        return reply.code(404).send({
          success: false,
          message: 'Club not found or is not active'
        });
      }
      
      if (error.message.includes('EMAIL_ALREADY_EXISTS')) {
        return reply.code(400).send({
          success: false,
          message: 'This email is already registered. Please use a different email address.'
        });
      }

      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to create team manager'
      });
    }
  }

  /**
   * GET /api/clubs/:clubId/team-managers
   * Get all team managers for a club
   */
  async getTeamManagers(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;

      // Validate authorization
      await this.teamManagerService.validateClubManagerAuthorization(
        userId,
        parseInt(clubId)
      );

      const teamManagers = await this.teamManagerService.getTeamManagers(
        parseInt(clubId)
      );

      reply.send({
        success: true,
        data: teamManagers,
        count: teamManagers.length
      });
    } catch (error) {
      request.log.error('Error getting team managers:', error);
      
      if (error.message.includes('UNAUTHORIZED_CLUB_ACCESS')) {
        return reply.code(403).send({
          success: false,
          message: 'You are not authorized to view team managers for this club'
        });
      }

      reply.code(500).send({
        success: false,
        message: 'Failed to get team managers'
      });
    }
  }

  /**
   * GET /api/clubs/:clubId/team-managers/:teamManagerId
   * Get team manager details by ID
   */
  async getTeamManagerById(request, reply) {
    try {
      const { clubId, teamManagerId } = request.params;
      const userId = request.user.id;

      // Validate authorization
      await this.teamManagerService.validateClubManagerAuthorization(
        userId,
        parseInt(clubId)
      );

      const teamManager = await this.teamManagerService.getTeamManagerById(
        parseInt(teamManagerId),
        parseInt(clubId)
      );

      reply.send({
        success: true,
        data: teamManager
      });
    } catch (error) {
      request.log.error('Error getting team manager:', error);
      
      if (error.message.includes('UNAUTHORIZED_CLUB_ACCESS')) {
        return reply.code(403).send({
          success: false,
          message: 'You are not authorized to view this team manager'
        });
      }
      
      if (error.message === 'Team manager not found') {
        return reply.code(404).send({
          success: false,
          message: 'Team manager not found'
        });
      }

      reply.code(500).send({
        success: false,
        message: 'Failed to get team manager'
      });
    }
  }

  /**
   * PUT /api/clubs/:clubId/team-managers/:teamManagerId
   * Update team manager details
   */
  async updateTeamManager(request, reply) {
    try {
      const { clubId, teamManagerId } = request.params;
      const userId = request.user.id;
      const updateData = request.body;

      // Validate authorization
      await this.teamManagerService.validateClubManagerAuthorization(
        userId,
        parseInt(clubId)
      );

      const teamManager = await this.teamManagerService.updateTeamManager(
        parseInt(teamManagerId),
        parseInt(clubId),
        updateData
      );

      reply.send({
        success: true,
        data: teamManager,
        message: 'Team manager updated successfully'
      });
    } catch (error) {
      request.log.error('Error updating team manager:', error);
      
      if (error.message.includes('UNAUTHORIZED_CLUB_ACCESS')) {
        return reply.code(403).send({
          success: false,
          message: 'You are not authorized to update this team manager'
        });
      }
      
      if (error.message === 'Team manager not found') {
        return reply.code(404).send({
          success: false,
          message: 'Team manager not found'
        });
      }

      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update team manager'
      });
    }
  }

  /**
   * DELETE /api/clubs/:clubId/team-managers/:teamManagerId
   * Deactivate team manager
   */
  async deactivateTeamManager(request, reply) {
    try {
      const { clubId, teamManagerId } = request.params;
      const userId = request.user.id;

      // Validate authorization
      await this.teamManagerService.validateClubManagerAuthorization(
        userId,
        parseInt(clubId)
      );

      const result = await this.teamManagerService.deactivateTeamManager(
        parseInt(teamManagerId),
        parseInt(clubId)
      );

      reply.send(result);
    } catch (error) {
      request.log.error('Error deactivating team manager:', error);
      
      if (error.message.includes('UNAUTHORIZED_CLUB_ACCESS')) {
        return reply.code(403).send({
          success: false,
          message: 'You are not authorized to deactivate this team manager'
        });
      }

      reply.code(500).send({
        success: false,
        message: 'Failed to deactivate team manager'
      });
    }
  }
}
