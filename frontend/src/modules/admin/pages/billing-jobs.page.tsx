/**
 * Billing Jobs Dashboard Page
 *
 * Super admin dashboard for monitoring and managing background billing workers.
 * Features:
 * - View status of all billing workers
 * - See last execution time and results
 * - Manually trigger workers
 * - View execution history
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  fetchWorkersStatus,
  fetchAllExecutionHistory,
  triggerWorker,
  type WorkerStatus,
  type WorkerExecution
} from '../actions/billing-jobs-actions';

export function BillingJobsPage() {
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [history, setHistory] = useState<WorkerExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringWorker, setTriggeringWorker] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch workers status and history
  const fetchData = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);
      const [workersData, historyData] = await Promise.all([
        fetchWorkersStatus(),
        fetchAllExecutionHistory(20)
      ]);
      setWorkers(workersData);
      setHistory(historyData);
      if (showToast) {
        toast.success('Data refreshed');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load worker status';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle trigger worker
  const handleTrigger = async (workerName: string) => {
    try {
      setTriggeringWorker(workerName);
      const result = await triggerWorker(workerName);
      toast.success(result.message);
      // Refresh data after trigger
      setTimeout(() => fetchData(), 1000);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to trigger worker';
      toast.error(message);
    } finally {
      setTriggeringWorker(null);
    }
  };

  // Format duration
  const formatDuration = (ms: number | null): string => {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-600">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing Jobs Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage background billing workers
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Worker Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workers.map((worker) => (
          <Card key={worker.workerName} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium">
                  {worker.displayName}
                </CardTitle>
                {worker.isRunning && (
                  <Badge variant="default" className="bg-blue-600">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Running
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {worker.schedule}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {worker.lastExecution ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Run:</span>
                    <span className="font-medium">
                      {formatDate(worker.lastExecution.startedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(worker.lastExecution.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{formatDuration(worker.lastExecution.durationMs)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Processed:</span>
                    <span>
                      {worker.lastExecution.itemsSuccessful}/
                      {worker.lastExecution.itemsProcessed}
                      {worker.lastExecution.itemsFailed > 0 && (
                        <span className="text-red-500 ml-1">
                          ({worker.lastExecution.itemsFailed} failed)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-muted-foreground text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Never executed
                </div>
              )}

              <Button
                className="w-full"
                size="sm"
                onClick={() => handleTrigger(worker.workerName)}
                disabled={worker.isRunning || triggeringWorker === worker.workerName}
              >
                {triggeringWorker === worker.workerName ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Recent worker executions across all workers</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>No execution history yet</p>
              <p className="text-sm">Workers will log their executions here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Processed</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">
                      {execution.displayName}
                    </TableCell>
                    <TableCell>{getStatusBadge(execution.status)}</TableCell>
                    <TableCell>{formatDate(execution.startedAt)}</TableCell>
                    <TableCell>{formatDuration(execution.durationMs)}</TableCell>
                    <TableCell className="text-right">
                      {execution.itemsProcessed}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {execution.itemsSuccessful}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {execution.itemsFailed > 0 ? execution.itemsFailed : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingJobsPage;
