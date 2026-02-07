import { apiClient } from '@/api/base';

export interface WorkerExecution {
  id: number;
  workerName: string;
  displayName: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  itemsProcessed: number;
  itemsSuccessful: number;
  itemsFailed: number;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface WorkerStatus {
  workerName: string;
  displayName: string;
  schedule: string;
  lastExecution: WorkerExecution | null;
  isRunning: boolean;
}

export interface TriggerResult {
  processed?: number;
  successful?: number;
  failed?: number;
  errors?: Array<{ subscriptionId?: number; paymentId?: number; error: string }>;
}

/**
 * Fetch status of all billing workers
 */
export async function fetchWorkersStatus(): Promise<WorkerStatus[]> {
  const response = await apiClient('/admin/billing/workers/status');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch workers status');
  }

  const data = await response.json();
  return data.workers;
}

/**
 * Fetch execution history for a specific worker
 */
export async function fetchWorkerHistory(
  workerName: string,
  limit: number = 50
): Promise<WorkerExecution[]> {
  const response = await apiClient(
    `/admin/billing/workers/${workerName}/history?limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch worker history');
  }

  const data = await response.json();
  return data.executions;
}

/**
 * Trigger a specific worker to run immediately
 */
export async function triggerWorker(
  workerName: string
): Promise<{ success: boolean; message: string; result?: TriggerResult }> {
  const response = await apiClient(
    `/admin/billing/workers/${workerName}/trigger`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to trigger worker');
  }

  return response.json();
}

/**
 * Fetch all execution history (all workers)
 */
export async function fetchAllExecutionHistory(
  limit: number = 50
): Promise<WorkerExecution[]> {
  const response = await apiClient(
    `/admin/billing/workers/history?limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch execution history');
  }

  const data = await response.json();
  return data.executions || [];
}
