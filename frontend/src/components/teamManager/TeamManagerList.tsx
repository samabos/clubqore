import React, { useEffect, useState } from 'react';
import { teamManagersAPI } from '@/api/teamManagers';
import { TeamManager } from '@/types/teamManager';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserCircle, 
  Mail, 
  Phone, 
  MoreVertical,
  AlertCircle,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface TeamManagerListProps {
  clubId: number;
  onEdit?: (teamManager: TeamManager) => void;
  refreshTrigger?: number;
}

export const TeamManagerList: React.FC<TeamManagerListProps> = ({
  clubId,
  onEdit,
  refreshTrigger = 0,
}) => {
  const [teamManagers, setTeamManagers] = useState<TeamManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedTeamManager, setSelectedTeamManager] = useState<TeamManager | null>(null);

  useEffect(() => {
    fetchTeamManagers();
  }, [clubId, refreshTrigger]);

  const fetchTeamManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamManagersAPI.getTeamManagers(clubId);
      setTeamManagers(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load team managers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateClick = (teamManager: TeamManager) => {
    setSelectedTeamManager(teamManager);
    setShowDeactivateDialog(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedTeamManager) return;

    try {
      setDeactivatingId(selectedTeamManager.id);
      await teamManagersAPI.deactivateTeamManager(clubId, parseInt(selectedTeamManager.id));
      
      toast.success('Team manager deactivated successfully');
      
      // Refresh the list
      await fetchTeamManagers();
      setShowDeactivateDialog(false);
      setSelectedTeamManager(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to deactivate team manager';
      toast.error(errorMessage);
    } finally {
      setDeactivatingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Managers</CardTitle>
          <CardDescription>Loading team managers...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Managers</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (teamManagers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Managers</CardTitle>
          <CardDescription>No team managers have been added yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Get started by adding your first team manager
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Managers</CardTitle>
          <CardDescription>
            {teamManagers.length} team {teamManagers.length === 1 ? 'manager' : 'managers'} in your club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamManagers.map((teamManager) => (
                  <TableRow key={teamManager.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{teamManager.fullName}</p>
                          <p className="text-sm text-gray-500">
                            {teamManager.firstName} {teamManager.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{teamManager.email}</span>
                        </div>
                        {teamManager.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{teamManager.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teamManager.specialization || (
                        <span className="text-gray-400">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {teamManager.accountNumber}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={teamManager.isActive ? 'default' : 'secondary'}
                      >
                        {teamManager.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onEdit?.(teamManager)}
                          >
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeactivateClick(teamManager)}
                            disabled={!teamManager.isActive}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Manager?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{selectedTeamManager?.fullName}</strong>?
              They will no longer be able to access the platform with their current credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              disabled={!!deactivatingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deactivatingId ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
