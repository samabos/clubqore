import { TrainingSessionService } from '../services/TrainingSessionService.js';
import { ClubService } from '../services/ClubService.js';

export class TrainingSessionController {
  constructor(db) {
    this.db = db;
    this.trainingSessionService = new TrainingSessionService(db);
    this.clubService = new ClubService(db);
  }

  // Create training session
  async createSession(request, reply) {
    try {
      const sessionData = request.body;
      const userId = request.user.id;
      const clubId = await this.clubService.getManagersClubId(userId);

      if (!clubId) {
        return reply.code(400).send({
          success: false,
          message: 'User is not associated with a club'
        });
      }

      // Check if team manager is trying to create session for teams they don't manage
      const userRoles = await this.db('user_roles')
        .where({ user_id: userId, is_active: true })
        .select('role_id');

      const roleIds = userRoles.map(r => r.role_id);
      const roles = await this.db('roles')
        .whereIn('id', roleIds)
        .select('name');

      const roleNames = roles.map(r => r.name);
      const isTeamManager = roleNames.includes('team_manager') && !roleNames.includes('club_manager');

      if (isTeamManager && sessionData.team_ids && sessionData.team_ids.length > 0) {
        // Check if team manager manages all specified teams
        const managedTeams = await this.db('teams')
          .where({ manager_id: userId, club_id: clubId })
          .select('id');

        const managedTeamIds = managedTeams.map(t => t.id);
        const unauthorizedTeams = sessionData.team_ids.filter(teamId => !managedTeamIds.includes(teamId));

        if (unauthorizedTeams.length > 0) {
          return reply.code(403).send({
            success: false,
            message: 'You can only create sessions for teams you manage'
          });
        }
      }

      const result = await this.trainingSessionService.createSession(clubId, userId, sessionData);
      reply.code(201).send(result);
    } catch (error) {
      request.log.error('Error creating training session:', error);

      // Extract meaningful error message
      let errorMessage = error.message || 'Failed to create training session';

      // If it's a database error, try to extract useful info
      if (error.code) {
        errorMessage = `Database error: ${error.message}`;
      }

      reply.code(400).send({
        success: false,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get all sessions for user's club
  async getSessions(request, reply) {
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
        from_date: request.query.from_date,
        to_date: request.query.to_date
      };

      const sessions = await this.trainingSessionService.getSessionsByClub(clubId, filters);
      reply.code(200).send({
        success: true,
        sessions
      });
    } catch (error) {
      request.log.error('Error fetching training sessions:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch training sessions'
      });
    }
  }

  // Get single session
  async getSession(request, reply) {
    try {
      const { sessionId } = request.params;
      const session = await this.trainingSessionService.getSessionById(sessionId);

      reply.code(200).send({
        success: true,
        session
      });
    } catch (error) {
      request.log.error('Error fetching training session:', error);
      reply.code(404).send({
        success: false,
        message: error.message || 'Training session not found'
      });
    }
  }

  // Update training session
  async updateSession(request, reply) {
    try {
      const { sessionId } = request.params;
      const sessionData = request.body;
      const userId = request.user.id;

      // Check permissions for team managers
      const session = await this.trainingSessionService.getSessionById(sessionId);

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
        // Check if team manager created this session or manages the teams
        const managedTeams = await this.db('teams')
          .where({ manager_id: userId })
          .select('id');

        const managedTeamIds = managedTeams.map(t => t.id);
        const sessionTeamIds = session.teams.map(t => t.id);
        const canEdit = session.created_by === userId ||
                       sessionTeamIds.every(teamId => managedTeamIds.includes(teamId));

        if (!canEdit) {
          return reply.code(403).send({
            success: false,
            message: 'You can only edit sessions you created or for teams you manage'
          });
        }

        // If updating team assignments, verify all new teams are managed by this team manager
        if (sessionData.team_ids) {
          const unauthorizedTeams = sessionData.team_ids.filter(teamId => !managedTeamIds.includes(teamId));
          if (unauthorizedTeams.length > 0) {
            return reply.code(403).send({
              success: false,
              message: 'You can only assign sessions to teams you manage'
            });
          }
        }
      }

      const result = await this.trainingSessionService.updateSession(sessionId, sessionData);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error updating training session:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to update training session'
      });
    }
  }

  // Delete training session
  async deleteSession(request, reply) {
    try {
      const { sessionId } = request.params;
      const userId = request.user.id;

      // Check permissions for team managers
      const session = await this.trainingSessionService.getSessionById(sessionId);

      const userRoles = await this.db('user_roles')
        .where({ user_id: userId, is_active: true })
        .select('role_id');

      const roleIds = userRoles.map(r => r.role_id);
      const roles = await this.db('roles')
        .whereIn('id', roleIds)
        .select('name');

      const roleNames = roles.map(r => r.name);
      const isTeamManager = roleNames.includes('team_manager') && !roleNames.includes('club_manager');

      if (isTeamManager && session.created_by !== userId) {
        return reply.code(403).send({
          success: false,
          message: 'You can only delete sessions you created'
        });
      }

      const result = await this.trainingSessionService.deleteSession(sessionId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error deleting training session:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to delete training session'
      });
    }
  }

  // Publish training session
  async publishSession(request, reply) {
    try {
      const { sessionId } = request.params;
      const result = await this.trainingSessionService.publishSession(sessionId);
      reply.code(200).send(result);
    } catch (error) {
      request.log.error('Error publishing training session:', error);
      reply.code(400).send({
        success: false,
        message: error.message || 'Failed to publish training session'
      });
    }
  }

  // Get upcoming sessions
  async getUpcomingSessions(request, reply) {
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
      const sessions = await this.trainingSessionService.getUpcomingSessions(clubId, limit);

      reply.code(200).send({
        success: true,
        sessions
      });
    } catch (error) {
      request.log.error('Error fetching upcoming sessions:', error);
      reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch upcoming sessions'
      });
    }
  }
}
