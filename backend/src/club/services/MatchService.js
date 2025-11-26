export class MatchService {
  constructor(db) {
    this.db = db;
  }

  // Create a new match
  async createMatch(clubId, userId, matchData) {
    try {
      const [matchId] = await this.db('matches')
        .insert({
          season_id: matchData.season_id || null,
          club_id: clubId,
          match_type: matchData.match_type || 'friendly',
          home_team_id: matchData.home_team_id,
          away_team_id: matchData.away_team_id || null,
          opponent_name: matchData.opponent_name || null,
          is_home: matchData.is_home !== undefined ? matchData.is_home : true,
          venue: matchData.venue,
          date: matchData.date,
          start_time: matchData.start_time,
          end_time: matchData.end_time || null,
          competition_name: matchData.competition_name || null,
          home_score: null,
          away_score: null,
          status: matchData.status || 'draft',
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      return {
        success: true,
        match_id: matchId,
        message: 'Match created successfully'
      };
    } catch (error) {
      console.error('Error creating match:', error);
      throw new Error('Failed to create match');
    }
  }

  // Get all matches for a club
  async getMatchesByClub(clubId, filters = {}) {
    try {
      let query = this.db('matches')
        .leftJoin('teams as home_team', 'matches.home_team_id', 'home_team.id')
        .leftJoin('teams as away_team', 'matches.away_team_id', 'away_team.id')
        .leftJoin('seasons', 'matches.season_id', 'seasons.id')
        .select(
          'matches.*',
          'home_team.name as home_team_name',
          'home_team.color as home_team_color',
          'away_team.name as away_team_name',
          'away_team.color as away_team_color',
          'seasons.name as season_name'
        )
        .where({ 'matches.club_id': clubId });

      // Apply filters
      if (filters.status) {
        query = query.where({ 'matches.status': filters.status });
      }
      if (filters.season_id) {
        query = query.where({ 'matches.season_id': filters.season_id });
      }
      if (filters.team_id) {
        query = query.where(function() {
          this.where({ 'matches.home_team_id': filters.team_id })
            .orWhere({ 'matches.away_team_id': filters.team_id });
        });
      }
      if (filters.match_type) {
        query = query.where({ 'matches.match_type': filters.match_type });
      }
      if (filters.from_date) {
        query = query.where('matches.date', '>=', filters.from_date);
      }
      if (filters.to_date) {
        query = query.where('matches.date', '<=', filters.to_date);
      }

      const matches = await query
        .orderBy('matches.date', 'desc')
        .orderBy('matches.start_time', 'desc');

      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw new Error('Failed to fetch matches');
    }
  }

  // Get single match by ID
  async getMatchById(matchId) {
    try {
      const match = await this.db('matches')
        .leftJoin('teams as home_team', 'matches.home_team_id', 'home_team.id')
        .leftJoin('teams as away_team', 'matches.away_team_id', 'away_team.id')
        .leftJoin('seasons', 'matches.season_id', 'seasons.id')
        .select(
          'matches.*',
          'home_team.name as home_team_name',
          'home_team.color as home_team_color',
          'away_team.name as away_team_name',
          'away_team.color as away_team_color',
          'seasons.name as season_name'
        )
        .where({ 'matches.id': matchId })
        .first();

      if (!match) {
        throw new Error('Match not found');
      }

      // Get match events
      const events = await this.getMatchEvents(matchId);

      return {
        ...match,
        events
      };
    } catch (error) {
      console.error('Error fetching match:', error);
      throw new Error('Failed to fetch match');
    }
  }

  // Update match
  async updateMatch(matchId, matchData) {
    try {
      const updated = await this.db('matches')
        .where({ id: matchId })
        .update({
          ...(matchData.season_id !== undefined && { season_id: matchData.season_id }),
          ...(matchData.match_type !== undefined && { match_type: matchData.match_type }),
          ...(matchData.home_team_id !== undefined && { home_team_id: matchData.home_team_id }),
          ...(matchData.away_team_id !== undefined && { away_team_id: matchData.away_team_id }),
          ...(matchData.opponent_name !== undefined && { opponent_name: matchData.opponent_name }),
          ...(matchData.is_home !== undefined && { is_home: matchData.is_home }),
          ...(matchData.venue !== undefined && { venue: matchData.venue }),
          ...(matchData.date !== undefined && { date: matchData.date }),
          ...(matchData.start_time !== undefined && { start_time: matchData.start_time }),
          ...(matchData.end_time !== undefined && { end_time: matchData.end_time }),
          ...(matchData.competition_name !== undefined && { competition_name: matchData.competition_name }),
          ...(matchData.home_score !== undefined && { home_score: matchData.home_score }),
          ...(matchData.away_score !== undefined && { away_score: matchData.away_score }),
          ...(matchData.status !== undefined && { status: matchData.status }),
          updated_at: new Date()
        });

      if (!updated) {
        throw new Error('Match not found');
      }

      return {
        success: true,
        message: 'Match updated successfully'
      };
    } catch (error) {
      console.error('Error updating match:', error);
      throw new Error('Failed to update match');
    }
  }

  // Delete match
  async deleteMatch(matchId) {
    try {
      const deleted = await this.db('matches')
        .where({ id: matchId })
        .del();

      if (!deleted) {
        throw new Error('Match not found');
      }

      return {
        success: true,
        message: 'Match deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting match:', error);
      throw new Error('Failed to delete match');
    }
  }

  // Publish a match (change status from draft to published)
  async publishMatch(matchId) {
    try {
      const updated = await this.db('matches')
        .where({ id: matchId })
        .update({
          status: 'published',
          updated_at: new Date()
        });

      if (!updated) {
        throw new Error('Match not found');
      }

      return {
        success: true,
        message: 'Match published successfully'
      };
    } catch (error) {
      console.error('Error publishing match:', error);
      throw new Error('Failed to publish match');
    }
  }

  // Update match result
  async updateMatchResult(matchId, homeScore, awayScore) {
    try {
      const updated = await this.db('matches')
        .where({ id: matchId })
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: 'completed',
          updated_at: new Date()
        });

      if (!updated) {
        throw new Error('Match not found');
      }

      return {
        success: true,
        message: 'Match result updated successfully'
      };
    } catch (error) {
      console.error('Error updating match result:', error);
      throw new Error('Failed to update match result');
    }
  }

  // Add match event (goal, card, substitution)
  async addMatchEvent(matchId, eventData) {
    try {
      const [eventId] = await this.db('match_events')
        .insert({
          match_id: matchId,
          event_type: eventData.event_type,
          minute: eventData.minute,
          player_id: eventData.player_id || null,
          team_id: eventData.team_id,
          details: eventData.details || null,
          created_at: new Date()
        })
        .returning('id');

      return {
        success: true,
        event_id: eventId,
        message: 'Match event added successfully'
      };
    } catch (error) {
      console.error('Error adding match event:', error);
      throw new Error('Failed to add match event');
    }
  }

  // Get match events
  async getMatchEvents(matchId) {
    try {
      const events = await this.db('match_events')
        .leftJoin('user_children', 'match_events.player_id', 'user_children.id')
        .leftJoin('teams', 'match_events.team_id', 'teams.id')
        .select(
          'match_events.*',
          'user_children.first_name as player_first_name',
          'user_children.last_name as player_last_name',
          'teams.name as team_name',
          'teams.color as team_color'
        )
        .where({ 'match_events.match_id': matchId })
        .orderBy('match_events.minute', 'asc');

      return events;
    } catch (error) {
      console.error('Error fetching match events:', error);
      throw new Error('Failed to fetch match events');
    }
  }

  // Delete match event
  async deleteMatchEvent(eventId) {
    try {
      const deleted = await this.db('match_events')
        .where({ id: eventId })
        .del();

      if (!deleted) {
        throw new Error('Match event not found');
      }

      return {
        success: true,
        message: 'Match event deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting match event:', error);
      throw new Error('Failed to delete match event');
    }
  }

  // Get upcoming matches (published/scheduled, future dates)
  async getUpcomingMatches(clubId, limit = 10) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const matches = await this.db('matches')
        .leftJoin('teams as home_team', 'matches.home_team_id', 'home_team.id')
        .leftJoin('teams as away_team', 'matches.away_team_id', 'away_team.id')
        .select(
          'matches.*',
          'home_team.name as home_team_name',
          'home_team.color as home_team_color',
          'away_team.name as away_team_name',
          'away_team.color as away_team_color'
        )
        .where({ 'matches.club_id': clubId })
        .whereIn('matches.status', ['published', 'scheduled'])
        .where('matches.date', '>=', today)
        .orderBy('matches.date', 'asc')
        .orderBy('matches.start_time', 'asc')
        .limit(limit);

      return matches;
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      throw new Error('Failed to fetch upcoming matches');
    }
  }
}
