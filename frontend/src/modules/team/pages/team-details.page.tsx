import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchTeamById,
  fetchTeamMembers,
  assignMemberToTeam,
  removeMemberFromTeam,
  deleteTeam,
  fetchAssignedChildrenInClub,
  updateTeam,
} from "../actions";
import { Team, TeamMember, UpdateTeamRequest } from "../types";
// Use cached members store instead of direct API calls
import { useMembers } from "@/stores/membersStore";
import { ClubMember } from "../../member/types/component-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamPlayersTable } from "../components/team-players-table";
import { TeamForm } from "../components/team-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Users,
  UserCog,
  Volleyball,
} from "lucide-react";
import { TeamLoading } from "@/components/ui/loading";

export function TeamDetailsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableMembers, setAvailableMembers] = useState<ClubMember[]>([]);
  const { members: cachedMembers, loadMembers } = useMembers();
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigningMember, setIsAssigningMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadTeamDetails = useCallback(async () => {
    if (!teamId) return;

    try {
      setIsLoading(true);
      // Ensure club members are loaded (uses cache/TTL under the hood)
      await loadMembers();

      const [teamData, membersData, assignedChildrenIds] = await Promise.all([
        fetchTeamById(parseInt(teamId)),
        fetchTeamMembers(parseInt(teamId)),
        fetchAssignedChildrenInClub(),
      ]);

      setTeam(teamData);
      setMembers(membersData);

      // Debug: Log the data structures
      console.log("🔍 Team members data:", membersData);
      console.log("🔍 Club members data (cached):", cachedMembers);
      console.log("🔍 Assigned children IDs:", assignedChildrenIds);

      // Filter out children who are already assigned to ANY team, ensure only children, and only active members
      const availableMembers = cachedMembers.filter(
        (member) =>
          !assignedChildrenIds.includes(member.id) &&
          member.membershipType === "member" &&
          member.status === "Active"
      );
      console.log("🔍 Available players after filtering:", availableMembers);
      setAvailableMembers(availableMembers);
    } catch (error) {
      console.error("Error loading team details:", error);
      toast.error("Failed to load team details");
    } finally {
      setIsLoading(false);
    }
  }, [teamId, loadMembers, cachedMembers]);

  useEffect(() => {
    if (teamId) {
      loadTeamDetails();
    }
  }, [teamId, loadTeamDetails]);

  const handleAssignMember = async () => {
    
    if (!selectedMemberId || !teamId) return;

    // Validate that the selected member is a child
    const selectedMember = availableMembers.find(
      (member) => member.id.toString() === selectedMemberId
    );
    if (!selectedMember) {
      toast.error("Selected member not found");
      return;
    }

    try {
      setIsAssigningMember(true);
      await assignMemberToTeam(parseInt(teamId), {
        memberId: parseInt(selectedMemberId),
      });
      toast.success("Player assigned to team successfully");
      setSelectedMemberId("");
      loadTeamDetails(); // Refresh data
    } catch (error) {
      console.error("Error assigning player:", error);
      toast.error("Failed to assign player to team");
    } finally {
      setIsAssigningMember(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!teamId) return;

    try {
      await removeMemberFromTeam(parseInt(teamId), memberId);
      toast.success("Member removed successfully");
      loadTeamDetails(); // Refresh data
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleEditTeam = () => {
    if (team) {
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateTeam = async (data: UpdateTeamRequest) => {
    if (!team) return;

    try {
      setIsUpdating(true);
      await updateTeam(team.id, data);
      toast.success("Team updated successfully");
      setIsEditDialogOpen(false);
      loadTeamDetails(); // Refresh data
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) return;

    if (
      window.confirm(
        `Are you sure you want to delete "${team.name}"? This will remove all team assignments.`
      )
    ) {
      try {
        await deleteTeam(team.id);
        toast.success("Team deleted successfully");
        navigate("/app/teams");
      } catch (error) {
        console.error("Error deleting team:", error);
        toast.error("Failed to delete team");
      }
    }
  };

  if (isLoading) {
    return <TeamLoading message="Loading team details..." />;
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Team Not Found
        </h2>
        <p className="text-gray-600">
          The team you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button onClick={() => navigate("/app/teams")} className="mt-4">
          Back to Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/teams")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Volleyball
                className="w-5 h-5"
                style={{ color: team.color || "#3B82F6" }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant={team.is_active ? "default" : "secondary"}>
                  {team.is_active ? "Active" : "Inactive"}
                </Badge>
                <div className="flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {team.manager_first_name && team.manager_last_name
                      ? `${team.manager_first_name} ${team.manager_last_name}`
                      : "No manager assigned"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditTeam}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Team
          </Button>
          <Button variant="destructive" onClick={handleDeleteTeam}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Team
          </Button>
        </div>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Players ({members.length})
            </CardTitle>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select player to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignMember}
                  disabled={!selectedMemberId || isAssigningMember}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isAssigningMember ? "Adding..." : "Add Player"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Only players from this club can be added to teams
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeamPlayersTable
            members={members}
            onEdit={(userId) => navigate(`/app/club/member/manage/${userId}`)}
            onRemove={(assignmentId) => handleRemoveMember(assignmentId)}
          />
        </CardContent>
      </Card>

      {/* Edit Team Dialog */}
      <TeamForm
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateTeam}
        isEdit={true}
        initialData={team}
        isLoading={isUpdating}
      />
    </div>
  );
}
