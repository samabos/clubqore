import { SeasonService } from '../services/SeasonService.js';
import { ClubService } from '../../club/services/ClubService.js';

export class SeasonController {
  constructor(db) {
    this.db = db;
    this.seasonService = new SeasonService(db);
    this.clubService = new ClubService(db);
  }

  // Create season
  async createSeason(request, reply) {
    try {
      const seasonData = request.body;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const result = await this.seasonService.createSeason(clubId, seasonData);
      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error creating season:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to create season'
      });
    }
  }

  // Get all seasons for user's club
  async getSeasons(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const seasons = await this.seasonService.getSeasonsByClub(clubId);
      reply.code(200).send({
        success: true,
        seasons
      });
    } catch (error) {
      request.log.error('Error fetching seasons:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch seasons'
      });
    }
  }

  // Get active season
  async getActiveSeason(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const season = await this.seasonService.getActiveSeason(clubId);
      reply.code(200).send({
        success: true,
        season
      });
    } catch (error) {
      request.log.error('Error fetching active season:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch active season'
      });
    }
  }

  // Get single season
  async getSeason(request, reply) {
    try {
      const { seasonId } = request.params;
      const season = await this.seasonService.getSeasonById(seasonId);

      reply.code(200).send({
        success: true,
        season
      });
    } catch (error) {
      request.log.error('Error fetching season:', error);
      reply.code(404).send({
        success: false,
        message: error.message || 'Season not found'
      });
    }
  }

  // Update season
  async updateSeason(request, reply) {
    try {
      const { seasonId } = request.params;
      const seasonData = request.body;

      const result = await this.seasonService.updateSeason(seasonId, seasonData);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating season:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update season'
      });
    }
  }

  // Delete season
  async deleteSeason(request, reply) {
    try {
      const { seasonId } = request.params;
      const result = await this.seasonService.deleteSeason(seasonId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error deleting season:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to delete season'
      });
    }
  }

  // Set active season
  async setActiveSeason(request, reply) {
    try {
      const { seasonId } = request.params;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const result = await this.seasonService.setActiveSeason(clubId, seasonId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error setting active season:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to set active season'
      });
    }
  }
}
