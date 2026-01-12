import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { ScheduledInvoiceJob, ScheduledJobStatus } from "@/types/billing";
import { format } from "date-fns";

interface ScheduledJobsListProps {
  jobs: ScheduledInvoiceJob[];
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<
  ScheduledJobStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-blue-100 text-blue-800",
    icon: <Clock className="h-4 w-4" />,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-4 w-4" />,
  },
};

export function ScheduledJobsList({ jobs, isLoading }: ScheduledJobsListProps) {
  const formatDate = (date: string) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  const formatDateTime = (date: string) => {
    return format(new Date(date), "MMM dd, yyyy HH:mm");
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No scheduled invoice jobs found. Enable auto-generation in billing settings to schedule
          jobs for upcoming seasons.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Season</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invoices Generated</TableHead>
            <TableHead>Generated At</TableHead>
            <TableHead>Error Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const statusConfig = STATUS_CONFIG[job.status];
            return (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{job.season_name || `Season #${job.season_id}`}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(job.scheduled_date)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusConfig.color}>
                    <span className="flex items-center gap-1">
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  {job.status === "completed" ? (
                    <span className="font-medium">{job.invoices_generated}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {job.generated_at ? (
                    <span className="text-sm">{formatDateTime(job.generated_at)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {job.error_message ? (
                    <span className="text-sm text-destructive max-w-xs truncate block">
                      {job.error_message}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
