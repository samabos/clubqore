/**
 * Config Audit Dialog
 *
 * Displays audit trail for a system configuration
 * Shows who changed what, when, and why
 */

import { useState, useEffect } from 'react';
import { Loader2, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { getConfigAuditHistory, type SystemConfigAudit } from '@/api/systemConfig';
import { formatDistanceToNow } from 'date-fns';

interface ConfigAuditDialogProps {
  configId: number;
  onClose: () => void;
}

export function ConfigAuditDialog({ configId, onClose }: ConfigAuditDialogProps) {
  const [auditHistory, setAuditHistory] = useState<SystemConfigAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditHistory = async () => {
      try {
        setLoading(true);
        const data = await getConfigAuditHistory(configId, 50);
        setAuditHistory(data);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to load audit history';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditHistory();
  }, [configId]);

  // Render value display
  const renderValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">None</span>;
    }

    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="default">Enabled</Badge>
      ) : (
        <Badge variant="secondary">Disabled</Badge>
      );
    }

    if (typeof value === 'object') {
      return <code className="text-xs">{JSON.stringify(value)}</code>;
    }

    return <span className="font-medium">{String(value)}</span>;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Configuration Change History</DialogTitle>
          <DialogDescription>
            View all changes made to this configuration
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : auditHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No change history available
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {auditHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-gray-50"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {entry.changed_by_first_name} {entry.changed_by_last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({entry.changed_by_email})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Values */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Previous Value</p>
                      {renderValue(entry.old_value)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">New Value</p>
                      {renderValue(entry.new_value)}
                    </div>
                  </div>

                  {/* Change Reason */}
                  {entry.change_reason && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                      <p className="text-xs font-medium text-blue-900 mb-1">Reason</p>
                      <p className="text-sm text-blue-800">{entry.change_reason}</p>
                    </div>
                  )}

                  {/* Technical Details */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {entry.ip_address && (
                      <span>IP: {entry.ip_address}</span>
                    )}
                    <span>
                      {new Date(entry.changed_at).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
