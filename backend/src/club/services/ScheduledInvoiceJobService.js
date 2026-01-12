export class ScheduledInvoiceJobService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a scheduled invoice job for a season
   */
  async createJobForSeason(clubId, seasonId, scheduledDate) {
    try {
      // Check if job already exists
      const existingJob = await this.db('scheduled_invoice_jobs')
        .where('club_id', clubId)
        .where('season_id', seasonId)
        .first();

      if (existingJob) {
        throw new Error('Scheduled job already exists for this season');
      }

      const [jobId] = await this.db('scheduled_invoice_jobs')
        .insert({
          club_id: clubId,
          season_id: seasonId,
          scheduled_date: scheduledDate,
          status: 'pending',
          invoices_generated: 0,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      return {
        success: true,
        job_id: jobId,
        message: 'Scheduled invoice job created successfully'
      };
    } catch (error) {
      console.error('Error creating scheduled job:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled jobs for a club
   */
  async getJobsByClub(clubId, filters = {}) {
    try {
      let query = this.db('scheduled_invoice_jobs')
        .select(
          'scheduled_invoice_jobs.*',
          'seasons.name as season_name',
          'seasons.start_date as season_start_date',
          'seasons.end_date as season_end_date'
        )
        .leftJoin('seasons', 'scheduled_invoice_jobs.season_id', 'seasons.id')
        .where('scheduled_invoice_jobs.club_id', clubId);

      if (filters.status) {
        query = query.where('scheduled_invoice_jobs.status', filters.status);
      }

      if (filters.season_id) {
        query = query.where('scheduled_invoice_jobs.season_id', filters.season_id);
      }

      const jobs = await query.orderBy('scheduled_invoice_jobs.scheduled_date', 'desc');

      return jobs;
    } catch (error) {
      console.error('Error fetching scheduled jobs:', error);
      throw error;
    }
  }

  /**
   * Get pending jobs that should be executed (scheduled_date <= today)
   */
  async getPendingJobs() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const jobs = await this.db('scheduled_invoice_jobs')
        .select(
          'scheduled_invoice_jobs.*',
          'clubs.name as club_name',
          'seasons.name as season_name'
        )
        .leftJoin('clubs', 'scheduled_invoice_jobs.club_id', 'clubs.id')
        .leftJoin('seasons', 'scheduled_invoice_jobs.season_id', 'seasons.id')
        .where('scheduled_invoice_jobs.status', 'pending')
        .where('scheduled_invoice_jobs.scheduled_date', '<=', today)
        .orderBy('scheduled_invoice_jobs.scheduled_date', 'asc');

      return jobs;
    } catch (error) {
      console.error('Error fetching pending jobs:', error);
      throw error;
    }
  }

  /**
   * Mark job as completed
   */
  async markJobCompleted(jobId, invoicesGenerated) {
    try {
      await this.db('scheduled_invoice_jobs')
        .where('id', jobId)
        .update({
          status: 'completed',
          generated_at: new Date(),
          invoices_generated: invoicesGenerated,
          error_message: null,
          updated_at: new Date()
        });

      return {
        success: true,
        message: 'Job marked as completed'
      };
    } catch (error) {
      console.error('Error marking job as completed:', error);
      throw error;
    }
  }

  /**
   * Mark job as failed
   */
  async markJobFailed(jobId, errorMessage) {
    try {
      await this.db('scheduled_invoice_jobs')
        .where('id', jobId)
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date()
        });

      return {
        success: true,
        message: 'Job marked as failed'
      };
    } catch (error) {
      console.error('Error marking job as failed:', error);
      throw error;
    }
  }

  /**
   * Calculate scheduled date based on billing settings
   */
  async calculateScheduledDate(clubId, seasonStartDate) {
    try {
      const settings = await this.db('billing_settings')
        .where('club_id', clubId)
        .first();

      if (!settings || !settings.auto_generation_enabled) {
        return null;
      }

      const daysBeforeSeason = settings.days_before_season || 7;
      const startDate = new Date(seasonStartDate);
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() - daysBeforeSeason);

      return scheduledDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating scheduled date:', error);
      throw error;
    }
  }

  /**
   * Schedule jobs for a new season
   * Called when a season is created
   */
  async scheduleJobsForNewSeason(clubId, seasonId, seasonStartDate) {
    try {
      // Get billing settings
      const settings = await this.db('billing_settings')
        .where('club_id', clubId)
        .first();

      // Only schedule if auto-generation is enabled
      if (!settings || !settings.auto_generation_enabled) {
        return {
          success: true,
          scheduled: false,
          message: 'Auto-generation not enabled for this club'
        };
      }

      // Calculate scheduled date
      const scheduledDate = await this.calculateScheduledDate(clubId, seasonStartDate);

      if (!scheduledDate) {
        throw new Error('Failed to calculate scheduled date');
      }

      // Create scheduled job
      const result = await this.createJobForSeason(clubId, seasonId, scheduledDate);

      return {
        ...result,
        scheduled: true,
        scheduled_date: scheduledDate
      };
    } catch (error) {
      console.error('Error scheduling jobs for new season:', error);
      throw error;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId) {
    try {
      const job = await this.db('scheduled_invoice_jobs')
        .where('id', jobId)
        .where('status', 'failed')
        .first();

      if (!job) {
        throw new Error('Job not found or not in failed status');
      }

      await this.db('scheduled_invoice_jobs')
        .where('id', jobId)
        .update({
          status: 'pending',
          error_message: null,
          updated_at: new Date()
        });

      return {
        success: true,
        message: 'Job reset to pending status for retry'
      };
    } catch (error) {
      console.error('Error retrying job:', error);
      throw error;
    }
  }

  /**
   * Admin: Get all scheduled jobs across all clubs
   */
  async adminGetAllJobs(filters = {}) {
    try {
      let query = this.db('scheduled_invoice_jobs')
        .select(
          'scheduled_invoice_jobs.*',
          'clubs.name as club_name',
          'seasons.name as season_name'
        )
        .leftJoin('clubs', 'scheduled_invoice_jobs.club_id', 'clubs.id')
        .leftJoin('seasons', 'scheduled_invoice_jobs.season_id', 'seasons.id');

      if (filters.status) {
        query = query.where('scheduled_invoice_jobs.status', filters.status);
      }

      if (filters.club_id) {
        query = query.where('scheduled_invoice_jobs.club_id', filters.club_id);
      }

      const jobs = await query.orderBy('scheduled_invoice_jobs.scheduled_date', 'desc');

      return jobs;
    } catch (error) {
      console.error('Error fetching all scheduled jobs:', error);
      throw error;
    }
  }

  /**
   * Delete a scheduled job
   * Only allowed for pending jobs
   */
  async deleteJob(jobId, clubId) {
    try {
      const job = await this.db('scheduled_invoice_jobs')
        .where('id', jobId)
        .where('club_id', clubId)
        .where('status', 'pending')
        .first();

      if (!job) {
        throw new Error('Job not found or cannot be deleted');
      }

      await this.db('scheduled_invoice_jobs')
        .where('id', jobId)
        .del();

      return {
        success: true,
        message: 'Scheduled job deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting scheduled job:', error);
      throw error;
    }
  }
}
