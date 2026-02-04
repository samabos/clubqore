/**
 * @deprecated OBSOLETE - This file has been moved to schedule/services/
 * This file is kept temporarily for reference and can be safely deleted.
 * New location: backend/src/schedule/services/SeasonService.js
 */
export class SeasonService {
  constructor(db) {
    this.db = db;
  }

  // Create a new season
  async createSeason(clubId, seasonData) {
    try {
      const [seasonId] = await this.db('seasons')
        .insert({
          club_id: clubId,
          name: seasonData.name,
          start_date: seasonData.start_date,
          end_date: seasonData.end_date,
          is_active: seasonData.is_active !== undefined ? seasonData.is_active : true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      return {
        success: true,
        season_id: seasonId,
        message: 'Season created successfully'
      };
    } catch (error) {
      console.error('Error creating season:', error);
      throw new Error('Failed to create season');
    }
  }

  // Get all seasons for a club (excludes soft-deleted)
  async getSeasonsByClub(clubId) {
    try {
      const seasons = await this.db('seasons')
        .select('*')
        .where({ club_id: clubId })
        .whereNull('deleted_at')
        .orderBy('start_date', 'desc');

      // Get counts of sessions and matches for each season
      const seasonsWithCounts = await Promise.all(
        seasons.map(async (season) => {
          const [sessionCount] = await this.db('training_sessions')
            .count('* as count')
            .where({ season_id: season.id });

          const [matchCount] = await this.db('matches')
            .count('* as count')
            .where({ season_id: season.id });

          return {
            ...season,
            session_count: parseInt(sessionCount.count),
            match_count: parseInt(matchCount.count)
          };
        })
      );

      return seasonsWithCounts;
    } catch (error) {
      console.error('Error fetching seasons:', error);
      throw new Error('Failed to fetch seasons');
    }
  }

  // Get active season for a club (excludes soft-deleted)
  async getActiveSeason(clubId) {
    try {
      const season = await this.db('seasons')
        .select('*')
        .where({ club_id: clubId, is_active: true })
        .whereNull('deleted_at')
        .first();

      return season || null;
    } catch (error) {
      console.error('Error fetching active season:', error);
      throw new Error('Failed to fetch active season');
    }
  }

  // Get single season by ID
  async getSeasonById(seasonId) {
    try {
      const season = await this.db('seasons')
        .select('*')
        .where({ id: seasonId })
        .first();

      if (!season) {
        throw new Error('Season not found');
      }

      // Get session and match counts
      const [sessionCount] = await this.db('training_sessions')
        .count('* as count')
        .where({ season_id: season.id });

      const [matchCount] = await this.db('matches')
        .count('* as count')
        .where({ season_id: season.id });

      return {
        ...season,
        session_count: parseInt(sessionCount.count),
        match_count: parseInt(matchCount.count)
      };
    } catch (error) {
      console.error('Error fetching season:', error);
      throw new Error('Failed to fetch season');
    }
  }

  // Update season
  async updateSeason(seasonId, seasonData) {
    try {
      const updated = await this.db('seasons')
        .where({ id: seasonId })
        .update({
          ...(seasonData.name !== undefined && { name: seasonData.name }),
          ...(seasonData.start_date !== undefined && { start_date: seasonData.start_date }),
          ...(seasonData.end_date !== undefined && { end_date: seasonData.end_date }),
          ...(seasonData.is_active !== undefined && { is_active: seasonData.is_active }),
          updated_at: new Date()
        });

      if (!updated) {
        throw new Error('Season not found');
      }

      return {
        success: true,
        message: 'Season updated successfully'
      };
    } catch (error) {
      console.error('Error updating season:', error);
      throw new Error('Failed to update season');
    }
  }

  // Soft delete season
  async deleteSeason(seasonId) {
    try {
      const updated = await this.db('seasons')
        .where({ id: seasonId })
        .whereNull('deleted_at')
        .update({
          deleted_at: new Date(),
          updated_at: new Date()
        });

      if (!updated) {
        throw new Error('Season not found or already deleted');
      }

      return {
        success: true,
        message: 'Season deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting season:', error);
      throw new Error('Failed to delete season');
    }
  }

  // Set season as active (deactivates all other seasons for the club)
  async setActiveSeason(clubId, seasonId) {
    try {
      // First, deactivate all seasons for this club (only non-deleted)
      await this.db('seasons')
        .where({ club_id: clubId })
        .whereNull('deleted_at')
        .update({ is_active: false, updated_at: new Date() });

      // Then activate the specified season (if not deleted)
      await this.db('seasons')
        .where({ id: seasonId, club_id: clubId })
        .whereNull('deleted_at')
        .update({ is_active: true, updated_at: new Date() });

      return {
        success: true,
        message: 'Active season updated successfully'
      };
    } catch (error) {
      console.error('Error setting active season:', error);
      throw new Error('Failed to set active season');
    }
  }
}
