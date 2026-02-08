/**
 * Worker Execution Service
 *
 * Tracks and manages background worker execution history.
 * Provides methods for starting, completing, and querying worker runs.
 */

export class WorkerExecutionService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Start tracking a worker execution
   *
   * @param {string} workerName - Name of the worker
   * @returns {Promise<number>} Execution ID
   */
  async startExecution(workerName) {
    const [execution] = await this.db('worker_executions')
      .insert({
        worker_name: workerName,
        status: 'running',
        started_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('id');

    return execution.id || execution;
  }

  /**
   * Mark execution as completed
   *
   * @param {number} executionId - Execution ID
   * @param {Object} stats - Execution statistics
   * @param {number} stats.processed - Items processed
   * @param {number} stats.successful - Items successful
   * @param {number} stats.failed - Items failed
   * @param {Object} stats.metadata - Additional metadata
   */
  async completeExecution(executionId, stats = {}) {
    const completedAt = new Date();
    const execution = await this.db('worker_executions')
      .where({ id: executionId })
      .first();

    const durationMs = execution
      ? completedAt.getTime() - new Date(execution.started_at).getTime()
      : null;

    await this.db('worker_executions')
      .where({ id: executionId })
      .update({
        status: 'completed',
        completed_at: completedAt,
        duration_ms: durationMs,
        items_processed: stats.processed || 0,
        items_successful: stats.successful || 0,
        items_failed: stats.failed || 0,
        metadata: stats.metadata ? JSON.stringify(stats.metadata) : null,
        updated_at: new Date()
      });
  }

  /**
   * Mark execution as failed
   *
   * @param {number} executionId - Execution ID
   * @param {string} errorMessage - Error message
   */
  async failExecution(executionId, errorMessage) {
    const completedAt = new Date();
    const execution = await this.db('worker_executions')
      .where({ id: executionId })
      .first();

    const durationMs = execution
      ? completedAt.getTime() - new Date(execution.started_at).getTime()
      : null;

    await this.db('worker_executions')
      .where({ id: executionId })
      .update({
        status: 'failed',
        completed_at: completedAt,
        duration_ms: durationMs,
        error_message: errorMessage,
        updated_at: new Date()
      });
  }

  /**
   * Get latest execution for each worker
   *
   * Note: Most billing workers were removed as GoCardless handles payment
   * scheduling and retries natively via Subscriptions API.
   *
   * Remaining workers:
   * - subscription_sync: Syncs local subscriptions to GoCardless
   * - notification_retry: Retries failed email/notification sends
   *
   * @returns {Promise<Array>} Latest executions by worker
   */
  async getLatestExecutions() {
    const workers = [
      'subscription_sync',
      'notification_retry'
    ];

    const results = [];

    for (const workerName of workers) {
      const latest = await this.db('worker_executions')
        .where({ worker_name: workerName })
        .orderBy('started_at', 'desc')
        .first();

      const isRunning = latest?.status === 'running';

      results.push({
        workerName,
        displayName: this.getWorkerDisplayName(workerName),
        schedule: this.getWorkerSchedule(workerName),
        lastExecution: latest ? this.formatExecution(latest) : null,
        isRunning
      });
    }

    return results;
  }

  /**
   * Get execution history for a specific worker
   *
   * @param {string} workerName - Worker name
   * @param {number} limit - Max records to return
   * @returns {Promise<Array>} Execution history
   */
  async getExecutionHistory(workerName = null, limit = 50) {
    let query = this.db('worker_executions')
      .orderBy('started_at', 'desc')
      .limit(limit);

    if (workerName) {
      query = query.where({ worker_name: workerName });
    }

    const executions = await query;
    return executions.map(e => this.formatExecution(e));
  }

  /**
   * Check if a worker is currently running
   *
   * @param {string} workerName - Worker name
   * @returns {Promise<boolean>} True if running
   */
  async isWorkerRunning(workerName) {
    const running = await this.db('worker_executions')
      .where({ worker_name: workerName, status: 'running' })
      .first();

    return !!running;
  }

  /**
   * Get worker display name
   * @private
   */
  getWorkerDisplayName(workerName) {
    const names = {
      subscription_sync: 'Subscription Sync',
      notification_retry: 'Notification Retry'
    };
    return names[workerName] || workerName;
  }

  /**
   * Get worker schedule description
   * @private
   */
  getWorkerSchedule(workerName) {
    const schedules = {
      subscription_sync: 'Every 5 minutes',
      notification_retry: 'Every 15 minutes'
    };
    return schedules[workerName] || 'Unknown';
  }

  /**
   * Format execution for API response
   * @private
   */
  formatExecution(execution) {
    return {
      id: execution.id,
      workerName: execution.worker_name,
      displayName: this.getWorkerDisplayName(execution.worker_name),
      status: execution.status,
      startedAt: execution.started_at,
      completedAt: execution.completed_at,
      durationMs: execution.duration_ms,
      itemsProcessed: execution.items_processed,
      itemsSuccessful: execution.items_successful,
      itemsFailed: execution.items_failed,
      errorMessage: execution.error_message,
      metadata: execution.metadata,
      createdAt: execution.created_at
    };
  }
}

export default WorkerExecutionService;
