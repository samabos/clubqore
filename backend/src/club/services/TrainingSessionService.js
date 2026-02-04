/**
 * @deprecated OBSOLETE - This file has been moved to schedule/services/
 * This file is kept temporarily for reference and can be safely deleted.
 * New location: backend/src/schedule/services/TrainingSessionService.js
 */
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
        const insertData = {
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
          recurrence_days: sessionData.recurrence_days && Array.isArray(sessionData.recurrence_days)
            ? trx.raw('?::integer[]', [sessionData.recurrence_days])
            : null,
          recurrence_end_date: sessionData.recurrence_end_date,
          parent_session_id: null,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date()
        };

        const [parentResult] = await trx('training_sessions')
          .insert(insertData)
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

        // OPTION B: DO NOT create child sessions!
        // Occurrences will be generated virtually using generateOccurrences()
        // Exceptions stored in training_session_exceptions table

        await trx.commit();

        // Calculate how many occurrences were generated for the message
        const occurrenceCount = dates.length;

        return {
          success: true,
          session_id: parentId,
          sessions_created: 1, // Only parent created
          occurrences_count: occurrenceCount,
          message: `Recurring training session created with ${occurrenceCount} occurrences`
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

      // For recurring sessions, don't apply date filters at the parent level
      // We'll handle them when generating occurrences
      const parentDateFilter = {
        from_date: filters.from_date,
        to_date: filters.to_date
      };

      const sessions = await query.orderBy('training_sessions.date', 'desc')
        .orderBy('training_sessions.start_time', 'desc');

      // Check if we should expand recurring sessions (default: true)
      const shouldExpand = filters.expand !== false;

      // If expand is false, just return database rows with teams
      if (!shouldExpand) {
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
      }

      // Expand recurring sessions into virtual occurrences
      const allOccurrences = [];

      for (const session of sessions) {
        // Get assigned teams for this session
        const teams = await this.db('training_session_teams')
          .join('teams', 'training_session_teams.team_id', 'teams.id')
          .select('teams.*')
          .where({ 'training_session_teams.training_session_id': session.id });

        const sessionWithTeams = {
          ...session,
          teams,
          team_count: teams.length
        };

        if (session.is_recurring) {
          // Generate virtual occurrences for recurring session
          // Default date range: 1 year in the past to 1 year in the future
          const defaultFromDate = new Date();
          defaultFromDate.setFullYear(defaultFromDate.getFullYear() - 1);
          const defaultToDate = new Date();
          defaultToDate.setFullYear(defaultToDate.getFullYear() + 1);

          const fromDate = parentDateFilter.from_date ? new Date(parentDateFilter.from_date) : defaultFromDate;
          const toDate = parentDateFilter.to_date ? new Date(parentDateFilter.to_date) : defaultToDate;

          const occurrences = await this.generateOccurrences(
            sessionWithTeams,
            fromDate,
            toDate
          );
          allOccurrences.push(...occurrences);
        } else {
          // Non-recurring session - add as-is if within date range
          if (parentDateFilter.from_date && session.date < parentDateFilter.from_date) {
            continue;
          }
          if (parentDateFilter.to_date && session.date > parentDateFilter.to_date) {
            continue;
          }
          allOccurrences.push(sessionWithTeams);
        }
      }

      // Sort all occurrences by date and time
      allOccurrences.sort((a, b) => {
        const dateA = typeof a.date === 'string' ? a.date : a.date?.toISOString?.() || '';
        const dateB = typeof b.date === 'string' ? b.date : b.date?.toISOString?.() || '';

        if (dateA !== dateB) {
          return dateB.localeCompare(dateA); // Descending
        }

        const timeA = typeof a.start_time === 'string' ? a.start_time : '';
        const timeB = typeof b.start_time === 'string' ? b.start_time : '';
        return timeB.localeCompare(timeA); // Descending
      });

      return allOccurrences;
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

  // Publish a session (change status from draft to scheduled)
  async publishSession(sessionId) {
    try {
      const updated = await this.db('training_sessions')
        .where({ id: sessionId })
        .update({
          status: 'scheduled',
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

  async cancelSession(sessionId, clubId) {
    try {
      // Get session and verify it exists and belongs to the club
      const session = await this.db('training_sessions')
        .where({ id: sessionId, club_id: clubId })
        .first();

      if (!session) {
        throw new Error('Training session not found');
      }

      // Only allow cancelling scheduled sessions
      if (session.status !== 'scheduled') {
        throw new Error('Only scheduled sessions can be cancelled');
      }

      // Update status to cancelled
      const updated = await this.db('training_sessions')
        .where({ id: sessionId })
        .update({
          status: 'cancelled',
          updated_at: new Date()
        });

      if (!updated) {
        throw new Error('Failed to update training session');
      }

      return {
        success: true,
        message: 'Training session cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling training session:', error);
      throw new Error(`Failed to cancel training session: ${error.message}`);
    }
  }

  // Get upcoming sessions (non-draft, future dates)
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
        .where('training_sessions.status', '!=', 'draft')
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

  // ============================================================================
  // VIRTUAL RECURRENCE WITH EXCEPTIONS (Option B Architecture)
  // ============================================================================

  /**
   * Generate virtual occurrences for a recurring session with exceptions applied
   * @param {Object} parentSession - The parent recurring session
   * @param {Date} fromDate - Start of date range
   * @param {Date} toDate - End of date range
   * @returns {Array} Array of occurrence objects with exceptions applied
   */
  async generateOccurrences(parentSession, fromDate, toDate) {
    if (!parentSession.is_recurring) {
      // Non-recurring session, return single occurrence if in date range
      const sessionDate = new Date(parentSession.date);
      const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
      const to = toDate instanceof Date ? toDate : new Date(toDate);

      if (sessionDate >= from && sessionDate <= to) {
        return [{
          ...parentSession,
          occurrence_date: parentSession.date,
          is_exception: false,
          exception_id: null,
          exception_type: null
        }];
      }
      return [];
    }

    // Get all exceptions for this session
    const exceptions = await this.db('training_session_exceptions')
      .where('training_session_id', parentSession.id)
      .select('*');

    const exceptionMap = new Map(
      exceptions.map(ex => [ex.occurrence_date, ex])
    );

    // Generate date range from recurrence rule
    const recurrenceDays = parentSession.recurrence_days
      ? (typeof parentSession.recurrence_days === 'string'
          ? JSON.parse(parentSession.recurrence_days)
          : parentSession.recurrence_days)
      : null;

    // Ensure dates are in proper format for generateRecurringDates
    const endDateForGeneration = parentSession.recurrence_end_date
      ? (typeof parentSession.recurrence_end_date === 'string'
          ? parentSession.recurrence_end_date
          : parentSession.recurrence_end_date.toISOString().split('T')[0])
      : (toDate instanceof Date
          ? toDate.toISOString().split('T')[0]
          : toDate);

    const dates = this.generateRecurringDates(
      parentSession.date,
      parentSession.recurrence_pattern,
      endDateForGeneration,
      recurrenceDays
    );

    console.log(`[generateOccurrences] Session ${parentSession.id}: Generated ${dates.length} dates from ${parentSession.date} to ${endDateForGeneration}`);

    // Filter to requested date range
    const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
    const to = toDate instanceof Date ? toDate : new Date(toDate);

    const filteredDates = dates.filter(date => {
      const d = new Date(date);
      return d >= from && d <= to;
    });

    console.log(`[generateOccurrences] Filtered to ${filteredDates.length} dates between ${from.toISOString().split('T')[0]} and ${to.toISOString().split('T')[0]}`);

    // Build occurrences with exceptions applied
    const occurrences = [];

    for (const date of filteredDates) {
      const exception = exceptionMap.get(date);

      // Skip cancelled occurrences
      if (exception && exception.exception_type === 'cancelled') {
        continue;
      }

      // Build occurrence with exception overrides
      const occurrence = {
        ...parentSession,
        occurrence_date: exception?.override_date || date,

        // Apply overrides if exception exists (null checks to allow explicit nulls)
        date: exception?.override_date !== undefined ? exception.override_date : date,
        start_time: exception?.override_start_time !== undefined ? exception.override_start_time : parentSession.start_time,
        end_time: exception?.override_end_time !== undefined ? exception.override_end_time : parentSession.end_time,
        title: exception?.override_title !== undefined ? exception.override_title : parentSession.title,
        description: exception?.override_description !== undefined ? exception.override_description : parentSession.description,
        location: exception?.override_location !== undefined ? exception.override_location : parentSession.location,
        coach_id: exception?.override_coach_id !== undefined ? exception.override_coach_id : parentSession.coach_id,
        max_participants: exception?.override_max_participants !== undefined ? exception.override_max_participants : parentSession.max_participants,
        status: exception?.override_status !== undefined ? exception.override_status : parentSession.status,

        // Metadata
        is_exception: !!exception,
        exception_id: exception?.id || null,
        exception_type: exception?.exception_type || null
      };

      occurrences.push(occurrence);
    }

    return occurrences;
  }

  /**
   * Get schedule with recurring sessions expanded into virtual occurrences
   * @param {number} clubId - Club ID
   * @param {Date} fromDate - Start date
   * @param {Date} toDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of occurrences
   */
  async getScheduleWithOccurrences(clubId, fromDate, toDate, filters = {}) {
    try {
      // Fetch all parent sessions (non-recurring + recurring parents)
      let query = this.db('training_sessions')
        .leftJoin('users as coach', 'training_sessions.coach_id', 'coach.id')
        .leftJoin('user_profiles as coach_profile', 'coach.id', 'coach_profile.user_id')
        .leftJoin('seasons', 'training_sessions.season_id', 'seasons.id')
        .where('training_sessions.club_id', clubId)
        .where(function() {
          // Include non-recurring sessions in date range
          this.where(function() {
            this.where('training_sessions.is_recurring', false)
              .whereBetween('training_sessions.date', [fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]]);
          })
          // OR recurring sessions that might have occurrences in range
          .orWhere(function() {
            this.where('training_sessions.is_recurring', true)
              .where('training_sessions.date', '<=', toDate.toISOString().split('T')[0])
              .where(function() {
                this.where('training_sessions.recurrence_end_date', '>=', fromDate.toISOString().split('T')[0])
                  .orWhereNull('training_sessions.recurrence_end_date');
              });
          });
        })
        .select(
          'training_sessions.*',
          'coach.id as coach_user_id',
          'coach.email as coach_email',
          'coach_profile.first_name as coach_first_name',
          'coach_profile.last_name as coach_last_name',
          'seasons.name as season_name'
        );

      // Apply filters
      if (filters.status) {
        query = query.where('training_sessions.status', filters.status);
      }
      if (filters.session_type) {
        query = query.where('training_sessions.session_type', filters.session_type);
      }
      if (filters.team_id) {
        query = query
          .join('training_session_teams', 'training_sessions.id', 'training_session_teams.training_session_id')
          .where('training_session_teams.team_id', filters.team_id);
      }

      const sessions = await query;

      // Expand recurring sessions into occurrences
      const allOccurrences = [];

      for (const session of sessions) {
        const occurrences = await this.generateOccurrences(
          session,
          fromDate,
          toDate
        );
        allOccurrences.push(...occurrences);
      }

      // Sort by date and time
      allOccurrences.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });

      return allOccurrences;
    } catch (error) {
      console.error('Error fetching schedule with occurrences:', error);
      throw new Error(`Failed to fetch schedule: ${error.message}`);
    }
  }

  // ============================================================================
  // EXCEPTION MANAGEMENT
  // ============================================================================

  /**
   * Cancel a single occurrence of a recurring session
   * @param {number} sessionId - Parent session ID
   * @param {string} occurrenceDate - Date of occurrence to cancel
   * @param {number} userId - User performing the action
   */
  async cancelOccurrence(sessionId, occurrenceDate, userId) {
    try {
      await this.db('training_session_exceptions')
        .insert({
          training_session_id: sessionId,
          occurrence_date: occurrenceDate,
          exception_type: 'cancelled',
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .onConflict(['training_session_id', 'occurrence_date'])
        .merge();

      return {
        success: true,
        message: 'Occurrence cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling occurrence:', error);
      throw new Error(`Failed to cancel occurrence: ${error.message}`);
    }
  }

  /**
   * Reschedule a single occurrence
   * @param {number} sessionId - Parent session ID
   * @param {string} occurrenceDate - Original date
   * @param {string} newDate - New date
   * @param {string} newStartTime - New start time
   * @param {string} newEndTime - New end time
   * @param {number} userId - User performing the action
   */
  async rescheduleOccurrence(sessionId, occurrenceDate, newDate, newStartTime, newEndTime, userId) {
    try {
      await this.db('training_session_exceptions')
        .insert({
          training_session_id: sessionId,
          occurrence_date: occurrenceDate,
          exception_type: 'rescheduled',
          override_date: newDate,
          override_start_time: newStartTime,
          override_end_time: newEndTime,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .onConflict(['training_session_id', 'occurrence_date'])
        .merge();

      return {
        success: true,
        message: 'Occurrence rescheduled successfully'
      };
    } catch (error) {
      console.error('Error rescheduling occurrence:', error);
      throw new Error(`Failed to reschedule occurrence: ${error.message}`);
    }
  }

  /**
   * Modify a single occurrence (change any fields)
   * @param {number} sessionId - Parent session ID
   * @param {string} occurrenceDate - Date of occurrence
   * @param {Object} overrides - Fields to override
   * @param {number} userId - User performing the action
   */
  async modifyOccurrence(sessionId, occurrenceDate, overrides, userId) {
    try {
      const exceptionData = {
        training_session_id: sessionId,
        occurrence_date: occurrenceDate,
        exception_type: 'modified',
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Add overrides with 'override_' prefix
      const allowedFields = [
        'date', 'start_time', 'end_time', 'title', 'description',
        'location', 'coach_id', 'max_participants', 'status'
      ];

      allowedFields.forEach(field => {
        if (overrides[field] !== undefined) {
          const value = overrides[field];

          // For foreign key fields (coach_id), only set if value is valid (not null, undefined, or 0)
          if (field === 'coach_id') {
            if (value && value > 0) {
              exceptionData[`override_${field}`] = value;
            } else if (value === null) {
              // Explicitly allow null to clear the coach
              exceptionData[`override_${field}`] = null;
            }
            // Skip if 0 or undefined - don't add to exceptionData
          } else {
            exceptionData[`override_${field}`] = value;
          }
        }
      });

      await this.db('training_session_exceptions')
        .insert(exceptionData)
        .onConflict(['training_session_id', 'occurrence_date'])
        .merge();

      return {
        success: true,
        message: 'Occurrence modified successfully'
      };
    } catch (error) {
      console.error('Error modifying occurrence:', error);
      throw new Error(`Failed to modify occurrence: ${error.message}`);
    }
  }

  /**
   * Edit all future occurrences (splits recurring series)
   * @param {number} sessionId - Parent session ID
   * @param {string} occurrenceDate - Date to split from
   * @param {Object} updates - Updates to apply
   * @param {number} userId - User performing the action
   */
  async editFutureOccurrences(sessionId, occurrenceDate, updates, userId) {
    const trx = await this.db.transaction();

    try {
      // Get parent session
      const parentSession = await trx('training_sessions')
        .where('id', sessionId)
        .first();

      if (!parentSession) {
        throw new Error('Session not found');
      }

      // Calculate day before split date
      const splitDate = new Date(occurrenceDate);
      const dayBefore = new Date(splitDate);
      dayBefore.setDate(dayBefore.getDate() - 1);

      // Update parent session's end date to day before split
      await trx('training_sessions')
        .where('id', sessionId)
        .update({
          recurrence_end_date: dayBefore.toISOString().split('T')[0],
          updated_at: new Date()
        });

      // Create new recurring session starting from split date
      const newSessionData = {
        season_id: updates.season_id !== undefined ? updates.season_id : parentSession.season_id,
        club_id: parentSession.club_id,
        title: updates.title !== undefined ? updates.title : parentSession.title,
        description: updates.description !== undefined ? updates.description : parentSession.description,
        session_type: updates.session_type !== undefined ? updates.session_type : parentSession.session_type,
        date: occurrenceDate,
        start_time: updates.start_time !== undefined ? updates.start_time : parentSession.start_time,
        end_time: updates.end_time !== undefined ? updates.end_time : parentSession.end_time,
        location: updates.location !== undefined ? updates.location : parentSession.location,
        coach_id: updates.coach_id !== undefined ? updates.coach_id : parentSession.coach_id,
        max_participants: updates.max_participants !== undefined ? updates.max_participants : parentSession.max_participants,
        status: updates.status !== undefined ? updates.status : parentSession.status,
        is_recurring: true,
        recurrence_pattern: parentSession.recurrence_pattern,
        recurrence_days: parentSession.recurrence_days,
        recurrence_end_date: parentSession.recurrence_end_date,
        parent_session_id: null,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [newSession] = await trx('training_sessions')
        .insert(newSessionData)
        .returning('*');

      // Copy team assignments
      const teamAssignments = await trx('training_session_teams')
        .where('training_session_id', sessionId)
        .select('team_id');

      if (teamAssignments.length > 0) {
        const newAssignments = teamAssignments.map(ta => ({
          training_session_id: newSession.id,
          team_id: ta.team_id,
          assigned_at: new Date()
        }));
        await trx('training_session_teams').insert(newAssignments);
      }

      await trx.commit();

      return {
        success: true,
        new_series_id: newSession.id,
        message: 'Future occurrences updated successfully'
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error editing future occurrences:', error);
      throw new Error(`Failed to edit future occurrences: ${error.message}`);
    }
  }

  /**
   * Edit entire recurring series
   * @param {number} sessionId - Parent session ID
   * @param {Object} updates - Updates to apply
   * @param {number} userId - User performing the action
   */
  async editAllOccurrences(sessionId, updates, userId) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date()
      };

      const updated = await this.db('training_sessions')
        .where('id', sessionId)
        .update(updateData);

      if (!updated) {
        throw new Error('Session not found');
      }

      return {
        success: true,
        message: 'All occurrences updated successfully'
      };
    } catch (error) {
      console.error('Error editing all occurrences:', error);
      throw new Error(`Failed to edit all occurrences: ${error.message}`);
    }
  }

  /**
   * Delete an exception (restore occurrence to parent values)
   * @param {number} sessionId - Parent session ID
   * @param {string} occurrenceDate - Date of occurrence
   */
  async deleteException(sessionId, occurrenceDate) {
    try {
      await this.db('training_session_exceptions')
        .where({
          training_session_id: sessionId,
          occurrence_date: occurrenceDate
        })
        .delete();

      return {
        success: true,
        message: 'Exception removed successfully'
      };
    } catch (error) {
      console.error('Error deleting exception:', error);
      throw new Error(`Failed to delete exception: ${error.message}`);
    }
  }
}
