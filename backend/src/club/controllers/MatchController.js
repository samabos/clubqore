/**
 * @deprecated OBSOLETE - This file has been moved to schedule/controllers/
 * This file is kept temporarily for reference and can be safely deleted.
 * New location: backend/src/schedule/controllers/MatchController.js
 */
import { MatchService } from '../services/MatchService.js';
import { ClubService } from '../services/ClubService.js';

export class MatchController {
  constructor(db) {
    this.db = db;
    this.matchService = new MatchService(db);
    this.clubService = new ClubService(db);
  }

  // Create match
  async createMatch(request, reply) {
    try {
      const matchData = request.body;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Check if team manager is trying to create match for teams they don't manage
      const userRoles = await this.db('user_roles')
        .where({ user_id: userId, is_active: true })
        .select('role_id');

      const roleIds = userRoles.map(r => r.role_id);
      const roles = await this.db('roles')
        .whereIn('id', roleIds)
        .select('name');

      const roleNames = roles.map(r => r.name);
      const isTeamManager = roleNames.includes('team_manager') && !roleNames.includes('club_manager');

      if (isTeamManager) {
        // Check if team manager manages the home team (and away team if internal scrimmage)
        const managedTeams = await this.db('teams')
          .where({ manager_id: userId, club_id: clubId })
          .select('id');

        const managedTeamIds = managedTeams.map(t => t.id);

        if (!managedTeamIds.includes(matchData.home_team_id)) {
          return reply.code(403).send({
            success: false,
            message: 'You can only create matches for teams you manage'
          });
        }

        // If scrimmage, check away team too
        if (matchData.away_team_id && !managedTeamIds.includes(matchData.away_team_id)) {
          return reply.code(403).send({
            success: false,
            message: 'You can only create matches for teams you manage'
          });
        }
      }

      const result = await this.matchService.createMatch(clubId, userId, matchData);
      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error creating match:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to create match'
      });
    }
  }

  // Get all matches for user's club
  async getMatches(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Get filters from query params
      const filters = {
        status: request.query.status,
        season_id: request.query.season_id ? parseInt(request.query.season_id) : undefined,
        team_id: request.query.team_id ? parseInt(request.query.team_id) : undefined,
        match_type: request.query.match_type,
        from_date: request.query.from_date,
        to_date: request.query.to_date,
        expand: request.query.expand === 'true' // Default false (table view shows DB rows only)
      };

      const matches = await this.matchService.getMatchesByClub(clubId, filters);
      reply.code(200).send({
        success: true,
        matches
      });
    } catch (error) {
      request.log.error('Error fetching matches:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch matches'
      });
    }
  }

  // Get single match
  async getMatch(request, reply) {
    try {
      const { matchId } = request.params;
      const match = await this.matchService.getMatchById(matchId);

      reply.code(200).send({
        success: true,
        match
      });
    } catch (error) {
      request.log.error('Error fetching match:', error);
      reply.code(404).send({
        success: false,
        message: error.message || 'Match not found'
      });
    }
  }

  // Update match
  async updateMatch(request, reply) {
    try {
      const { matchId } = request.params;
      const matchData = request.body;
      const userId = request.user.id;

      // Check permissions for team managers
      const match = await this.matchService.getMatchById(matchId);

      const userRoles = await this.db('user_roles')
        .where({ user_id: userId, is_active: true })
        .select('role_id');

      const roleIds = userRoles.map(r => r.role_id);
      const roles = await this.db('roles')
        .whereIn('id', roleIds)
        .select('name');

      const roleNames = roles.map(r => r.name);
      const isTeamManager = roleNames.includes('team_manager') && !roleNames.includes('club_manager');

      if (isTeamManager) {
        // Check if team manager created this match or manages the teams
        const managedTeams = await this.db('teams')
          .where({ manager_id: userId })
          .select('id');

        const managedTeamIds = managedTeams.map(t => t.id);
        const canEdit = match.created_by === userId ||
                       managedTeamIds.includes(match.home_team_id) ||
                       (match.away_team_id && managedTeamIds.includes(match.away_team_id));

        if (!canEdit) {
          return reply.code(403).send({
            success: false,
            message: 'You can only edit matches you created or for teams you manage'
          });
        }
      }

      const result = await this.matchService.updateMatch(matchId, matchData);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating match:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update match'
      });
    }
  }

  // Delete match
  async deleteMatch(request, reply) {
    try {
      const { matchId } = request.params;
      const userId = request.user.id;

      // Check permissions for team managers
      const match = await this.matchService.getMatchById(matchId);

      const userRoles = await this.db('user_roles')
        .where({ user_id: userId, is_active: true })
        .select('role_id');

      const roleIds = userRoles.map(r => r.role_id);
      const roles = await this.db('roles')
        .whereIn('id', roleIds)
        .select('name');

      const roleNames = roles.map(r => r.name);
      const isTeamManager = roleNames.includes('team_manager') && !roleNames.includes('club_manager');

      if (isTeamManager && match.created_by !== userId) {
        return reply.code(403).send({
          success: false,
          message: 'You can only delete matches you created'
        });
      }

      const result = await this.matchService.deleteMatch(matchId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error deleting match:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to delete match'
      });
    }
  }

  // Publish match
  async publishMatch(request, reply) {
    try {
      const { matchId } = request.params;
      const result = await this.matchService.publishMatch(matchId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error publishing match:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to publish match'
      });
    }
  }

  // Update match result
  async updateMatchResult(request, reply) {
    try {
      const { matchId } = request.params;
      const { home_score, away_score } = request.body;

      const result = await this.matchService.updateMatchResult(matchId, home_score, away_score);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating match result:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update match result'
      });
    }
  }

  // Add match event
  async addMatchEvent(request, reply) {
    try {
      const { matchId } = request.params;
      const eventData = request.body;

      const result = await this.matchService.addMatchEvent(matchId, eventData);
      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error adding match event:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to add match event'
      });
    }
  }

  // Get match events
  async getMatchEvents(request, reply) {
    try {
      const { matchId } = request.params;
      const events = await this.matchService.getMatchEvents(matchId);

      reply.code(200).send({
        success: true,
        events
      });
    } catch (error) {
      request.log.error('Error fetching match events:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch match events'
      });
    }
  }

  // Delete match event
  async deleteMatchEvent(request, reply) {
    try {
      const { eventId } = request.params;
      const result = await this.matchService.deleteMatchEvent(eventId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error deleting match event:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to delete match event'
      });
    }
  }

  // Get upcoming matches
  async getUpcomingMatches(request, reply) {
    try {
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      const limit = request.query.limit ? parseInt(request.query.limit) : 10;
      const matches = await this.matchService.getUpcomingMatches(clubId, limit);

      reply.code(200).send({
        success: true,
        matches
      });
    } catch (error) {
      request.log.error('Error fetching upcoming matches:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch upcoming matches'
      });
    }
  }
}
