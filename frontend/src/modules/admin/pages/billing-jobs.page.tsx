/**
 * Background Jobs Dashboard Page
 *
 * Super admin dashboard for monitoring background workers.
 *
 * Note: Payment scheduling and retries are handled by GoCardless
 * natively via Subscriptions API.
 *
 * Workers:
 * - Subscription Sync: Syncs local subscriptions to GoCardless (runs every 5 min)
 * - Notification Retry: Retries failed email/notification sends (runs every 15 min)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  AlertTriangle
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
  fetchSubscriptionDiagnostic,
  type WorkerStatus,
  type WorkerExecution,
  type DiagnosticResult
} from '../actions/billing-jobs-actions';

export function BillingJobsPage() {
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [history, setHistory] = useState<WorkerExecution[]>([]);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringWorker, setTriggeringWorker] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 10;

  // Fetch workers status and history
  const fetchData = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);
      const [workersData, historyData, diagnosticData] = await Promise.all([
        fetchWorkersStatus(),
        fetchAllExecutionHistory(50),
        fetchSubscriptionDiagnostic()
      ]);
      setWorkers(workersData);
      setHistory(historyData);
      setDiagnostic(diagnosticData);
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

  // Paginated history
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return history.slice(start, start + historyPageSize);
  }, [history, historyPage]);

  const totalHistoryPages = Math.ceil(history.length / historyPageSize);

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
          <h1 className="text-2xl font-bold">Background Jobs</h1>
          <p className="text-muted-foreground">
            Monitor notification and scheduling workers. Payment collection is handled by GoCardless.
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
            <>
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
                {paginatedHistory.map((execution) => (
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

            {/* Pagination */}
            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((historyPage - 1) * historyPageSize) + 1}-{Math.min(historyPage * historyPageSize, history.length)} of {history.length} executions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {historyPage} of {totalHistoryPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage === totalHistoryPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Subscription Sync Diagnostic */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowDiagnostic(!showDiagnostic)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {showDiagnostic ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                Subscription Sync Diagnostic
              </CardTitle>
              <CardDescription>
                Debug why subscriptions are or aren&apos;t being synced to GoCardless
              </CardDescription>
            </div>
            {diagnostic && (
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{diagnostic.summary.total}</span>
                </span>
                <span className="text-green-600">
                  Needs Sync: <span className="font-medium">{diagnostic.summary.needsSync}</span>
                </span>
                <span className="text-amber-600">
                  Blocked: <span className="font-medium">{diagnostic.summary.blocked}</span>
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        {showDiagnostic && diagnostic && (
          <CardContent className="space-y-6">
            {/* Subscriptions Needing Sync */}
            {diagnostic.subscriptionsNeedingSync.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Subscriptions Ready for Sync ({diagnostic.subscriptionsNeedingSync.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mandate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnostic.subscriptionsNeedingSync.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                        <TableCell>{sub.club || '-'}</TableCell>
                        <TableCell>{sub.tier || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.childName || 'No name'}</div>
                            <div className="text-xs text-muted-foreground">{sub.childEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.parentName || 'No name'}</div>
                            <div className="text-xs text-muted-foreground">{sub.parentEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>£{parseFloat(sub.amount || '0').toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="default">{sub.subscriptionStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            {sub.mandateStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Blocked Subscriptions */}
            {diagnostic.blockedSubscriptions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-amber-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Subscriptions Not Ready for Sync ({diagnostic.blockedSubscriptions.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Parent Mandate</TableHead>
                      <TableHead>Sync Blockers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnostic.blockedSubscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                        <TableCell>{sub.club || '-'}</TableCell>
                        <TableCell>{sub.tier || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.childName || 'No name'}</div>
                            <div className="text-xs text-muted-foreground">{sub.childEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.parentName || 'No name'}</div>
                            <div className="text-xs text-muted-foreground">{sub.parentEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={sub.subscriptionStatus === 'active' || sub.subscriptionStatus === 'pending' ? 'default' : 'secondary'}
                          >
                            {sub.subscriptionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {sub.parentMandateStatus ? (
                              <Badge
                                variant={sub.parentMandateStatus === 'active' ? 'default' : 'secondary'}
                                className={sub.parentMandateStatus === 'active' ? 'bg-green-600' : ''}
                              >
                                {sub.parentMandateStatus}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No mandate</Badge>
                            )}
                            {sub.providerMandateId && (
                              <div className="text-xs text-muted-foreground font-mono" title="GoCardless Mandate ID">
                                {sub.providerMandateId}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ul className="text-xs text-red-600 space-y-1">
                            {sub.syncBlockers.map((blocker, idx) => (
                              <li key={idx}>• {blocker}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {diagnostic.summary.total === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>No subscriptions found</p>
                <p className="text-sm">Create subscriptions through parent onboarding</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default BillingJobsPage;
