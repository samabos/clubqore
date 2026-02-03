/**
 * Parent Invites List Component
 *
 * Displays a table of parent invites with their status
 * Features:
 * - Filter by status (active, used, expired)
 * - Resend invite emails
 * - Cancel invites
 * - Copy invite links
 */

import { useState, useEffect } from 'react';
import { Copy, Mail, Trash2, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getClubInvites,
  resendInvite,
  cancelInvite,
  type ParentInvite,
} from '../actions/parent-invite-actions';
import { formatDistanceToNow } from 'date-fns';

interface ParentInvitesListProps {
  clubId: number;
  refreshTrigger?: number;
}

export function ParentInvitesList({ clubId, refreshTrigger = 0 }: ParentInvitesListProps) {
  const [invites, setInvites] = useState<ParentInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'used' | 'expired' | undefined>(undefined);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const { invites: fetchedInvites } = await getClubInvites(clubId, statusFilter);
      setInvites(fetchedInvites);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      fetchInvites();
    }
  }, [clubId, statusFilter, refreshTrigger]);

  const handleCopyLink = (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/register/parent/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied to clipboard');
  };

  const handleResend = async (inviteCode: string, inviteId: number) => {
    try {
      setResendingId(inviteId);
      await resendInvite(inviteCode, clubId);
      toast.success('Invitation email resent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invite');
    } finally {
      setResendingId(null);
    }
  };

  const handleCancel = async (inviteCode: string, inviteId: number) => {
    try {
      setCancelingId(inviteId);
      await cancelInvite(inviteCode, clubId);
      toast.success('Invitation cancelled successfully');
      fetchInvites(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel invite');
    } finally {
      setCancelingId(null);
    }
  };

  const getInviteStatus = (invite: ParentInvite) => {
    if (invite.isUsed) {
      return { label: 'Used', variant: 'default' as const, icon: CheckCircle2 };
    }
    const isExpired = new Date(invite.expiresAt) < new Date();
    if (isExpired) {
      return { label: 'Expired', variant: 'destructive' as const, icon: XCircle };
    }
    return { label: 'Active', variant: 'secondary' as const, icon: Clock };
  };

  const activeInvitesCount = invites.filter(i => !i.isUsed && new Date(i.expiresAt) > new Date()).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parent Invites</CardTitle>
          <CardDescription>Loading invites...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Parent Invites
                    {activeInvitesCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeInvitesCount} active
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Manage parent invitations to join your club
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardHeader className="pt-0">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === undefined ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(undefined)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'used' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('used')}
              >
                Used
              </Button>
              <Button
                variant={statusFilter === 'expired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('expired')}
              >
                Expired
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invites found. Click "Invite Parent" to send a new invitation.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invitee</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const status = getInviteStatus(invite);
                      const StatusIcon = status.icon;
                      const isExpiredOrUsed = invite.isUsed || new Date(invite.expiresAt) < new Date();

                      return (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">
                            {invite.inviteeFirstName && invite.inviteeLastName
                              ? `${invite.inviteeFirstName} ${invite.inviteeLastName}`
                              : '-'}
                          </TableCell>
                          <TableCell>{invite.inviteeEmail}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {invite.isUsed
                              ? formatDistanceToNow(new Date(invite.usedAt!), { addSuffix: true })
                              : formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {!isExpiredOrUsed && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyLink(invite.inviteCode)}
                                    title="Copy invite link"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResend(invite.inviteCode, invite.id)}
                                    disabled={resendingId === invite.id}
                                    title="Resend invitation email"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancel(invite.inviteCode, invite.id)}
                                    disabled={cancelingId === invite.id}
                                    title="Cancel invitation"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
