export class ParentScheduleController {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all upcoming events (training sessions + matches) for parent's children
   * GET /parent/schedule
   */
  async getChildrenSchedule(request, reply) {
    const parentUserId = request.user.id;

    try {
      // Get all children's team IDs with child information
      const childTeamMapping = await this.db('user_children')
        .join('team_members', 'user_children.id', 'team_members.user_child_id')
        .leftJoin('user_profiles', 'user_children.child_user_id', 'user_profiles.user_id')
        .where('user_children.parent_user_id', parentUserId)
        .select(
          'team_members.team_id',
          'user_children.id as child_id',
          'user_profiles.first_name as child_first_name',
          'user_profiles.last_name as child_last_name'
        );

      const teamIds = [...new Set(childTeamMapping.map(m => m.team_id))];

      if (teamIds.length === 0) {
        return reply.send({
          trainingSessions: [],
          matches: []
        });
      }

      // Fetch training sessions (through junction table)
      // Exclude draft status - parents can see scheduled, in_progress, completed, and cancelled events
      const trainingSessions = await this.db('training_sessions')
        .join('training_session_teams', 'training_sessions.id', 'training_session_teams.training_session_id')
        .join('teams', 'training_session_teams.team_id', 'teams.id')
        .whereIn('training_session_teams.team_id', teamIds)
        .where('training_sessions.date', '>=', this.db.fn.now())
        .where('training_sessions.status', '!=', 'draft')
        .orderBy('training_sessions.date', 'asc')
        .orderBy('training_sessions.start_time', 'asc')
        .select(
          'training_sessions.id',
          'training_session_teams.team_id',
          'training_sessions.title',
          'training_sessions.date',
          'training_sessions.start_time',
          'training_sessions.end_time',
          'training_sessions.location',
          'training_sessions.description',
          'training_sessions.session_type',
          'training_sessions.status',
          'training_sessions.created_at',
          'training_sessions.updated_at',
          'teams.name as team_name'
        );

      // Fetch matches (check both home and away team)
      // Exclude draft status - parents can see scheduled, in_progress, completed, and cancelled events
      const matches = await this.db('matches')
        .leftJoin('teams as home_team', 'matches.home_team_id', 'home_team.id')
        .leftJoin('teams as away_team', 'matches.away_team_id', 'away_team.id')
        .where(function() {
          this.whereIn('matches.home_team_id', teamIds)
            .orWhereIn('matches.away_team_id', teamIds);
        })
        .where('matches.date', '>=', this.db.fn.now())
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
        trainingSessions: addChildNames(trainingSessions),
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

      // Fetch training sessions (through junction table)
      // Exclude draft status - parents can see scheduled, in_progress, completed, and cancelled events
      const trainingSessions = await this.db('training_sessions')
        .join('training_session_teams', 'training_sessions.id', 'training_session_teams.training_session_id')
        .join('teams', 'training_session_teams.team_id', 'teams.id')
        .whereIn('training_session_teams.team_id', teamIds)
        .where('training_sessions.date', '>=', this.db.fn.now())
        .where('training_sessions.status', '!=', 'draft')
        .orderBy('training_sessions.date', 'asc')
        .orderBy('training_sessions.start_time', 'asc')
        .select(
          'training_sessions.id',
          'training_session_teams.team_id',
          'training_sessions.title',
          'training_sessions.date',
          'training_sessions.start_time',
          'training_sessions.end_time',
          'training_sessions.location',
          'training_sessions.description',
          'training_sessions.session_type',
          'training_sessions.status',
          'training_sessions.created_at',
          'training_sessions.updated_at',
          'teams.name as team_name'
        );

      // Fetch matches (check both home and away team)
      // Exclude draft status - parents can see scheduled, in_progress, completed, and cancelled events
      const matches = await this.db('matches')
        .leftJoin('teams as home_team', 'matches.home_team_id', 'home_team.id')
        .leftJoin('teams as away_team', 'matches.away_team_id', 'away_team.id')
        .where(function() {
          this.whereIn('matches.home_team_id', teamIds)
            .orWhereIn('matches.away_team_id', teamIds);
        })
        .where('matches.date', '>=', this.db.fn.now())
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
        trainingSessions: addChildName(trainingSessions),
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
