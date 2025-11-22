import { ClubService } from '../services/ClubService.js';
import { PersonnelService } from '../services/PersonnelService.js';

export class PersonnelController {
  constructor(db) {
    this.db = db;
    this.clubService = new ClubService(db);
    this.personnelService = new PersonnelService(db);
  }

  /**
   * GET /api/clubs/:clubId/personnel
   * Get club personnel (users with team_manager or staff role)
   */
  async getClubPersonnel(request, reply) {
    try {
      const { clubId } = request.params;
      const personnel = await this.personnelService.getClubPersonnel(parseInt(clubId));

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

      // Check if email already used
      if (!(await this.clubService.isEmailAvailable(personnelData.email))) {
        return reply.code(400).send({
          success: false,
          message: 'Email is already in use'
        });
      }

      const personnel = await this.personnelService.addPersonnelToClub(parseInt(clubId), personnelData);

      reply.code(201).send({
        success: true,
        message: 'Personnel added to club successfully',
        data: personnel
      });
    } catch (error) {
      request.log.error('Error adding personnel to club:', error);

      // Return 400 for validation errors (user already exists)
      if (error.message && error.message.includes('already exists')) {
        return reply.code(400).send({
          success: false,
          message: error.message
        });
      }

      // Return 500 for other errors
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

      const personnel = await this.personnelService.updatePersonnel(parseInt(userRoleId), updateData);

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
      const result = await this.personnelService.removePersonnelFromClub(parseInt(userRoleId));

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

  /**
   * GET /api/clubs/:clubId/personnel/team-managers
   * Get team managers for a club
   */
  async getClubTeamManagers(request, reply) {
    try {
      const { clubId } = request.params;
      const userId = request.user.id;

      // Validate authorization (optional, depending on your requirements)
      // await this.clubService.assertUserInClub(userId, parseInt(clubId));

      const teamManagers = await this.personnelService.getTeamManagers(parseInt(clubId));

      reply.send({
        success: true,
        data: teamManagers,
        count: teamManagers.length
      });
    } catch (error) {
      request.log.error('Error getting team managers:', error);

      if (error.message && error.message.includes('UNAUTHORIZED_CLUB_ACCESS')) {
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
}
