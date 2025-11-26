export class TrainingSessionService {
  constructor(db) {
    this.db = db;
  }

  // Helper: Generate recurring session dates
  generateRecurringDates(startDate, pattern, endDate, recurrenceDays = null) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start);

    while (current <= end) {
      if (pattern === 'daily') {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      } else if (pattern === 'weekly') {
        if (!recurrenceDays || recurrenceDays.length === 0) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 7);
        } else {
          // Find next matching day of week
          const currentDay = current.getDay();
          const nextDays = recurrenceDays.filter(day => day >= currentDay);

          if (nextDays.length > 0) {
            const daysToAdd = nextDays[0] - currentDay;
            current.setDate(current.getDate() + daysToAdd);
            if (current <= end) dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
          } else {
            // Move to next week, first selected day
            const daysToAdd = 7 - currentDay + recurrenceDays[0];
            current.setDate(current.getDate() + daysToAdd);
          }
        }
      } else if (pattern === 'biweekly') {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 14);
      } else if (pattern === 'monthly') {
        dates.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
    }

    return dates.map(d => d.toISOString().split('T')[0]);
  }

  // Create a new training session (with recurring support)
  async createSession(clubId, userId, sessionData) {
    const trx = await this.db.transaction();

    try {
      const isRecurring = sessionData.is_recurring || false;
      const sessionIds = [];

      if (isRecurring && sessionData.recurrence_end_date) {
        // Generate recurring sessions
        const dates = this.generateRecurringDates(
          sessionData.date,
          sessionData.recurrence_pattern,
          sessionData.recurrence_end_date,
          sessionData.recurrence_days
        );

        // Create parent session first
        const [parentResult] = await trx('training_sessions')
          .insert({
            season_id: sessionData.season_id || null,
            club_id: clubId,
            title: sessionData.title,
            description: sessionData.description || null,
            session_type: sessionData.session_type || 'training',
            date: sessionData.date,
            start_time: sessionData.start_time,
            end_time: sessionData.end_time,
            location: sessionData.location || null,
            coach_id: sessionData.coach_id || null,
            max_participants: sessionData.max_participants || null,
            status: sessionData.status || 'draft',
            is_recurring: true,
            recurrence_pattern: sessionData.recurrence_pattern,
            recurrence_days: sessionData.recurrence_days ? JSON.stringify(sessionData.recurrence_days) : null,
            recurrence_end_date: sessionData.recurrence_end_date,
            parent_session_id: null,
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('id');

        const parentId = parentResult.id;
        sessionIds.push(parentId);

        // Assign teams to parent
        if (sessionData.team_ids && sessionData.team_ids.length > 0) {
          const teamAssignments = sessionData.team_ids.map(teamId => ({
            training_session_id: parentId,
            team_id: teamId,
            assigned_at: new Date()
          }));
          await trx('training_session_teams').insert(teamAssignments);
        }

        // Create child sessions for each recurring date (skip first as it's the parent)
        for (let i = 1; i < dates.length; i++) {
          const [childResult] = await trx('training_sessions')
            .insert({
              season_id: sessionData.season_id || null,
              club_id: clubId,
              title: sessionData.title,
              description: sessionData.description || null,
              session_type: sessionData.session_type || 'training',
              date: dates[i],
              start_time: sessionData.start_time,
              end_time: sessionData.end_time,
              location: sessionData.location || null,
              coach_id: sessionData.coach_id || null,
              max_participants: sessionData.max_participants || null,
              status: sessionData.status || 'draft',
              is_recurring: false,
              recurrence_pattern: null,
              recurrence_days: null,
              recurrence_end_date: null,
              parent_session_id: parentId,
              created_by: userId,
              created_at: new Date(),
              updated_at: new Date()
            })
            .returning('id');

          const childId = childResult.id;
          sessionIds.push(childId);

          // Assign same teams to child session
          if (sessionData.team_ids && sessionData.team_ids.length > 0) {
            // Normalize team_ids: handle both integers and objects with id property
            const normalizedTeamIds = sessionData.team_ids.map(teamId => {
              // If it's an object with an id property, extract the id
              if (typeof teamId === 'object' && teamId !== null && 'id' in teamId) {
                return parseInt(teamId.id, 10);
              }
              // Otherwise treat it as a number
              return parseInt(teamId, 10);
            });

            const teamAssignments = normalizedTeamIds.map(teamId => ({
              training_session_id: childId,
              team_id: teamId,
              assigned_at: new Date()
            }));
            await trx('training_session_teams').insert(teamAssignments);
          }
        }

        await trx.commit();

        return {
          success: true,
          session_id: parentId,
          sessions_created: sessionIds.length,
          message: `${sessionIds.length} training sessions created successfully`
        };
      } else {
        // Create single one-time session
        const [result] = await trx('training_sessions')
          .insert({
            season_id: sessionData.season_id || null,
            club_id: clubId,
            title: sessionData.title,
            description: sessionData.description || null,
            session_type: sessionData.session_type || 'training',
            date: sessionData.date,
            start_time: sessionData.start_time,
            end_time: sessionData.end_time,
            location: sessionData.location || null,
            coach_id: sessionData.coach_id || null,
            max_participants: sessionData.max_participants || null,
            status: sessionData.status || 'draft',
            is_recurring: false,
            recurrence_pattern: null,
            recurrence_days: null,
            recurrence_end_date: null,
            parent_session_id: null,
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('id');

        const sessionId = result.id;

        // Assign teams to the session
        if (sessionData.team_ids && sessionData.team_ids.length > 0) {
          // Normalize team_ids: handle both integers and objects with id property
          const normalizedTeamIds = sessionData.team_ids.map(teamId => {
            // If it's an object with an id property, extract the id
            if (typeof teamId === 'object' && teamId !== null && 'id' in teamId) {
              return parseInt(teamId.id, 10);
            }
            // Otherwise treat it as a number
            return parseInt(teamId, 10);
          });

          const teamAssignments = normalizedTeamIds.map(teamId => ({
            training_session_id: sessionId,
            team_id: teamId,
            assigned_at: new Date()
          }));

          await trx('training_session_teams').insert(teamAssignments);
        }

        await trx.commit();

        return {
          success: true,
          session_id: sessionId,
          sessions_created: 1,
          message: 'Training session created successfully'
        };
      }
    } catch (error) {
      await trx.rollback();
      console.error('Error creating training session:', error);
      throw new Error(`Failed to create training session: ${error.message}`);
    }
  }

  // Get all sessions for a club
  async getSessionsByClub(clubId, filters = {}) {
    try {
      let query = this.db('training_sessions')
        .leftJoin('users as coach', 'training_sessions.coach_id', 'coach.id')
        .leftJoin('user_profiles as coach_profile', 'coach.id', 'coach_profile.user_id')
        .leftJoin('seasons', 'training_sessions.season_id', 'seasons.id')
        .select(
          'training_sessions.*',
          'coach.id as coach_user_id',
          'coach.email as coach_email',
          'coach_profile.first_name as coach_first_name',
          'coach_profile.last_name as coach_last_name',
          'seasons.name as season_name'
        )
        .where({ 'training_sessions.club_id': clubId });

      // Apply filters
      if (filters.status) {
        query = query.where({ 'training_sessions.status': filters.status });
      }
      if (filters.season_id) {
        query = query.where({ 'training_sessions.season_id': filters.season_id });
      }
      if (filters.team_id) {
        query = query.whereExists(function() {
          this.select('*')
            .from('training_session_teams')
            .whereRaw('training_session_teams.training_session_id = training_sessions.id')
            .where({ 'training_session_teams.team_id': filters.team_id });
        });
      }
      if (filters.from_date) {
        query = query.where('training_sessions.date', '>=', filters.from_date);
      }
      if (filters.to_date) {
        query = query.where('training_sessions.date', '<=', filters.to_date);
      }

      const sessions = await query.orderBy('training_sessions.date', 'desc')
        .orderBy('training_sessions.start_time', 'desc');

      // Get assigned teams for each session
      const sessionsWithTeams = await Promise.all(
        sessions.map(async (session) => {
          const teams = await this.db('training_session_teams')
            .join('teams', 'training_session_teams.team_id', 'teams.id')
            .select('teams.*')
            .where({ 'training_session_teams.training_session_id': session.id });

          return {
            ...session,
            teams,
            team_count: teams.length
          };
        })
      );

      return sessionsWithTeams;
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      throw new Error(`Failed to fetch training sessions: ${error.message}`);
    }
  }

  // Get single session by ID
  async getSessionById(sessionId) {
    try {
      const session = await this.db('training_sessions')
        .leftJoin('users as coach', 'training_sessions.coach_id', 'coach.id')
        .leftJoin('user_profiles as coach_profile', 'coach.id', 'coach_profile.user_id')
        .leftJoin('seasons', 'training_sessions.season_id', 'seasons.id')
        .select(
          'training_sessions.*',
          'coach.id as coach_user_id',
          'coach.email as coach_email',
          'coach_profile.first_name as coach_first_name',
          'coach_profile.last_name as coach_last_name',
          'seasons.name as season_name'
        )
        .where({ 'training_sessions.id': sessionId })
        .first();

      if (!session) {
        throw new Error('Training session not found');
      }

      // Get assigned teams
      const teams = await this.db('training_session_teams')
        .join('teams', 'training_session_teams.team_id', 'teams.id')
        .select('teams.*')
        .where({ 'training_session_teams.training_session_id': session.id });

      return {
        ...session,
        teams
      };
    } catch (error) {
      console.error('Error fetching training session:', error);
      throw new Error(`Failed to fetch training session: ${error.message}`);
    }
  }

  // Update training session
  async updateSession(sessionId, sessionData) {
    const trx = await this.db.transaction();

    try {
      const updated = await trx('training_sessions')
        .where({ id: sessionId })
        .update({
          ...(sessionData.season_id !== undefined && { season_id: sessionData.season_id }),
          ...(sessionData.title !== undefined && { title: sessionData.title }),
          ...(sessionData.description !== undefined && { description: sessionData.description }),
          ...(sessionData.session_type !== undefined && { session_type: sessionData.session_type }),
          ...(sessionData.date !== undefined && { date: sessionData.date }),
          ...(sessionData.start_time !== undefined && { start_time: sessionData.start_time }),
          ...(sessionData.end_time !== undefined && { end_time: sessionData.end_time }),
          ...(sessionData.location !== undefined && { location: sessionData.location }),
          ...(sessionData.coach_id !== undefined && { coach_id: sessionData.coach_id }),
          ...(sessionData.max_participants !== undefined && { max_participants: sessionData.max_participants }),
          ...(sessionData.status !== undefined && { status: sessionData.status }),
          updated_at: new Date()
        });

      if (!updated) {
        throw new Error('Training session not found');
      }

      // Update team assignments if provided
      if (sessionData.team_ids) {
        // Remove existing team assignments
        await trx('training_session_teams')
          .where({ training_session_id: sessionId })
          .del();

        // Add new team assignments
        if (sessionData.team_ids.length > 0) {
          const teamAssignments = sessionData.team_ids.map(teamId => ({
            training_session_id: sessionId,
            team_id: teamId,
            assigned_at: new Date()
          }));

          await trx('training_session_teams').insert(teamAssignments);
        }
      }

      await trx.commit();

      return {
        success: true,
        message: 'Training session updated successfully'
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error updating training session:', error);
      throw new Error(`Failed to update training session: ${error.message}`);
    }
  }

  // Delete training session
  async deleteSession(sessionId) {
    try {
      const deleted = await this.db('training_sessions')
        .where({ id: sessionId })
        .del();

      if (!deleted) {
        throw new Error('Training session not found');
      }

      return {
        success: true,
        message: 'Training session deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting training session:', error);
      throw new Error(`Failed to delete training session: ${error.message}`);
    }
  }

  // Publish a session (change status from draft to published)
  async publishSession(sessionId) {
    try {
      const updated = await this.db('training_sessions')
        .where({ id: sessionId })
        .update({
          status: 'published',
          updated_at: new Date()
        });

      if (!updated) {
        throw new Error('Training session not found');
      }

      return {
        success: true,
        message: 'Training session published successfully'
      };
    } catch (error) {
      console.error('Error publishing training session:', error);
      throw new Error(`Failed to publish training session: ${error.message}`);
    }
  }

  // Get upcoming sessions (published/scheduled, future dates)
  async getUpcomingSessions(clubId, limit = 10) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const sessions = await this.db('training_sessions')
        .leftJoin('users as coach', 'training_sessions.coach_id', 'coach.id')
        .leftJoin('user_profiles as coach_profile', 'coach.id', 'coach_profile.user_id')
        .select(
          'training_sessions.*',
          'coach_profile.first_name as coach_first_name',
          'coach_profile.last_name as coach_last_name'
        )
        .where({ 'training_sessions.club_id': clubId })
        .whereIn('training_sessions.status', ['published', 'scheduled'])
        .where('training_sessions.date', '>=', today)
        .orderBy('training_sessions.date', 'asc')
        .orderBy('training_sessions.start_time', 'asc')
        .limit(limit);

      // Get assigned teams for each session
      const sessionsWithTeams = await Promise.all(
        sessions.map(async (session) => {
          const teams = await this.db('training_session_teams')
            .join('teams', 'training_session_teams.team_id', 'teams.id')
            .select('teams.id', 'teams.name', 'teams.color')
            .where({ 'training_session_teams.training_session_id': session.id });

          return {
            ...session,
            teams
          };
        })
      );

      return sessionsWithTeams;
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      throw new Error(`Failed to fetch upcoming sessions: ${error.message}`);
    }
  }
}
