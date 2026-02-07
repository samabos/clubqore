import { TrainingSessionService } from '../../schedule/services/TrainingSessionService.js';

export class ParentScheduleController {
  constructor(db) {
    this.db = db;
    this.trainingSessionService = new TrainingSessionService(db);
  }

  /**
   * Get all upcoming events (training sessions + matches) for parent's children
   * GET /parent/schedule
   */
  async getChildrenSchedule(request, reply) {
    const parentUserId = request.user.id;

    try {
      // Get all children's team IDs with child information and club ID
      const childTeamMapping = await this.db('user_children')
        .join('team_members', 'user_children.id', 'team_members.user_child_id')
        .leftJoin('user_profiles', 'user_children.child_user_id', 'user_profiles.user_id')
        .where('user_children.parent_user_id', parentUserId)
        .select(
          'team_members.team_id',
          'user_children.id as child_id',
          'user_children.club_id',
          'user_profiles.first_name as child_first_name',
          'user_profiles.last_name as child_last_name'
        );

      const teamIds = [...new Set(childTeamMapping.map(m => m.team_id))];
      const clubIds = [...new Set(childTeamMapping.map(m => m.club_id).filter(Boolean))];

      if (teamIds.length === 0) {
        return reply.send({
          trainingSessions: [],
          matches: []
        });
      }

      // Use TrainingSessionService to fetch training sessions (handles recurring sessions)
      const fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0); // Start of today
      const toDate = new Date();
      toDate.setFullYear(toDate.getFullYear() + 1); // 1 year from now

      // Fetch all training sessions for these clubs/teams using the service
      const trainingSessions = [];
      for (const clubId of clubIds) {
        for (const teamId of teamIds) {
          const sessions = await this.trainingSessionService.getSessionsByClub(clubId, {
            team_id: teamId,
            from_date: fromDate.toISOString().split('T')[0],
            to_date: toDate.toISOString().split('T')[0],
          });

          // Filter out drafts and add team info
          const filteredSessions = sessions
            .filter(s => s.status !== 'draft')
            .map(s => ({
              id: s.id,
              team_id: teamId,
              title: s.title,
              date: s.occurrence_date || s.date,
              start_time: s.start_time,
              end_time: s.end_time,
              location: s.location,
              description: s.description,
              session_type: s.session_type,
              status: s.status,
              created_at: s.created_at,
              updated_at: s.updated_at,
              team_name: s.teams?.[0]?.name || null,
              is_recurring: s.is_recurring,
              occurrence_date: s.occurrence_date,
            }));

          trainingSessions.push(...filteredSessions);
        }
      }

      // Remove duplicates (same session might be returned for multiple teams)
      const uniqueSessions = [];
      const seenKeys = new Set();
      for (const session of trainingSessions) {
        const key = `${session.id}-${session.date}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueSessions.push(session);
        }
      }

      // Sort by date ascending
      uniqueSessions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return (a.start_time || '').localeCompare(b.start_time || '');
      });

      // Fetch matches (check both home and away team)
      // Exclude draft status - parents can see scheduled, in_progress, completed, and cancelled events
      // Use CURRENT_DATE for date comparison since date column is DATE type (not TIMESTAMP)
      const matches = await this.db('matches')
        .leftJoin('teams as home_team', 'matches.home_team_id', 'home_team.id')
        .leftJoin('teams as away_team', 'matches.away_team_id', 'away_team.id')
        .where(function() {
          this.whereIn('matches.home_team_id', teamIds)
            .orWhereIn('matches.away_team_id', teamIds);
        })
        .whereRaw('matches.date >= CURRENT_DATE')
        .where('matches.status', '!=', 'draft')
        .orderBy('matches.date', 'asc')
        .orderBy('matches.start_time', 'asc')
        .select(
          'matches.id',
          'matches.home_team_id',
          'matches.away_team_id',
          'matches.opponent_name as opponent',
          'matches.date',
          'matches.start_time',
          'matches.end_time',
          'matches.venue as location',
          'matches.is_home',
          'matches.match_type',
          'matches.competition_name as competition',
          'matches.home_score',
          'matches.away_score',
          'matches.status',
          'matches.created_at',
          'matches.updated_at',
          this.db.raw('CASE WHEN matches.home_team_id IN (' + teamIds.join(',') + ') THEN home_team.name ELSE away_team.name END as team_name'),
          this.db.raw('CASE WHEN matches.home_team_id IN (' + teamIds.join(',') + ') THEN matches.home_team_id ELSE matches.away_team_id END as team_id')
        );

      // Add child names to events based on team_id
      // Returns array of children when multiple children are in the same team
      const addChildNames = (events) => {
        return events.map(event => {
          // Use Number() to ensure type consistency for comparison
          const eventTeamId = Number(event.team_id);
          const children = childTeamMapping
            .filter(m => Number(m.team_id) === eventTeamId)
            .map(m => ({
              first_name: m.child_first_name,
              last_name: m.child_last_name
            }));

          return {
            ...event,
            // For backwards compatibility, keep first child in single fields
            child_first_name: children[0]?.first_name || null,
            child_last_name: children[0]?.last_name || null,
            // New field: array of all children for this event
            children: children.length > 0 ? children : null,
          };
        });
      };

      return reply.send({
        trainingSessions: addChildNames(uniqueSessions),
        matches: addChildNames(matches)
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        message: 'Failed to fetch children schedule'
      });
    }
  }

  /**
   * Get schedule for a specific child
   * GET /parent/children/:childId/schedule
   */
  async getChildSchedule(request, reply) {
    const parentUserId = request.user.id;
    const { childId } = request.params;

    try {
      // Verify parent owns this child and get child info
      const child = await this.db('user_children')
        .leftJoin('user_profiles', 'user_children.child_user_id', 'user_profiles.user_id')
        .where({
          'user_children.id': childId,
          'user_children.parent_user_id': parentUserId
        })
        .select(
          'user_children.*',
          'user_profiles.first_name',
          'user_profiles.last_name'
        )
        .first();

      if (!child) {
        return reply.status(404).send({
          message: 'Child not found'
        });
      }

      // Get child's team IDs
      const teamIds = await this.db('team_members')
        .where('user_child_id', childId)
        .pluck('team_id');

      if (teamIds.length === 0) {
        return reply.send({
          trainingSessions: [],
          matches: []
        });
      }

      // Get child's club ID
      const clubId = child.club_id;

      // Use TrainingSessionService to fetch training sessions (handles recurring sessions)
      const fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0); // Start of today
      const toDate = new Date();
      toDate.setFullYear(toDate.getFullYear() + 1); // 1 year from now

      // Fetch all training sessions for these teams using the service
      const trainingSessions = [];
      if (clubId) {
        for (const teamId of teamIds) {
          const sessions = await this.trainingSessionService.getSessionsByClub(clubId, {
            team_id: teamId,
            from_date: fromDate.toISOString().split('T')[0],
            to_date: toDate.toISOString().split('T')[0],
          });

          // Filter out drafts and add team info
          const filteredSessions = sessions
            .filter(s => s.status !== 'draft')
            .map(s => ({
              id: s.id,
              team_id: teamId,
              title: s.title,
              date: s.occurrence_date || s.date,
              start_time: s.start_time,
              end_time: s.end_time,
              location: s.location,
              description: s.description,
              session_type: s.session_type,
              status: s.status,
              created_at: s.created_at,
              updated_at: s.updated_at,
              team_name: s.teams?.[0]?.name || null,
              is_recurring: s.is_recurring,
              occurrence_date: s.occurrence_date,
            }));

          trainingSessions.push(...filteredSessions);
        }
      }

      // Remove duplicates (same session might be returned for multiple teams)
      const uniqueSessions = [];
      const seenKeys = new Set();
      for (const session of trainingSessions) {
        const key = `${session.id}-${session.date}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueSessions.push(session);
        }
      }

      // Sort by date ascending
      uniqueSessions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return (a.start_time || '').localeCompare(b.start_time || '');
      });

      // Fetch matches (check both home and away team)
      // Exclude draft status - parents can see scheduled, in_progress, completed, and cancelled events
      // Use CURRENT_DATE for date comparison since date column is DATE type (not TIMESTAMP)
      const matches = await this.db('matches')
        .leftJoin('teams as home_team', 'matches.home_team_id', 'home_team.id')
        .leftJoin('teams as away_team', 'matches.away_team_id', 'away_team.id')
        .where(function() {
          this.whereIn('matches.home_team_id', teamIds)
            .orWhereIn('matches.away_team_id', teamIds);
        })
        .whereRaw('matches.date >= CURRENT_DATE')
        .where('matches.status', '!=', 'draft')
        .orderBy('matches.date', 'asc')
        .orderBy('matches.start_time', 'asc')
        .select(
          'matches.id',
          'matches.home_team_id',
          'matches.away_team_id',
          'matches.opponent_name as opponent',
          'matches.date',
          'matches.start_time',
          'matches.end_time',
          'matches.venue as location',
          'matches.is_home',
          'matches.match_type',
          'matches.competition_name as competition',
          'matches.home_score',
          'matches.away_score',
          'matches.status',
          'matches.created_at',
          'matches.updated_at',
          this.db.raw('CASE WHEN matches.home_team_id IN (' + teamIds.join(',') + ') THEN home_team.name ELSE away_team.name END as team_name'),
          this.db.raw('CASE WHEN matches.home_team_id IN (' + teamIds.join(',') + ') THEN matches.home_team_id ELSE matches.away_team_id END as team_id')
        );

      // Add child name to all events
      const addChildName = (events) => {
        return events.map(event => ({
          ...event,
          child_first_name: child.first_name,
          child_last_name: child.last_name,
        }));
      };

      return reply.send({
        trainingSessions: addChildName(uniqueSessions),
        matches: addChildName(matches)
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        message: 'Failed to fetch child schedule'
      });
    }
  }
}
