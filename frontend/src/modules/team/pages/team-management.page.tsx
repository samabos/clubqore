import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/stores/authStore";
import { fetchTeams, createTeam, updateTeam, deleteTeam } from "../actions";
import { Team, CreateTeamRequest, UpdateTeamRequest } from "../types";
import { TeamList } from "../components/team-list";
import { TeamForm } from "../components/team-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TeamManagementPage() {
  const navigate = useNavigate();
  const { userClub } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load teams on component mount
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const teamsData = await fetchTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (data: CreateTeamRequest) => {
    try {
      setIsSubmitting(true);
      await createTeam(data);
      toast.success("Team created successfully!");
      setIsFormOpen(false);
      loadTeams();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async (data: UpdateTeamRequest) => {
    if (!editingTeam) return;

    try {
      setIsSubmitting(true);
      await updateTeam(editingTeam.id, data);
      toast.success("Team updated successfully!");
      setIsFormOpen(false);
      setEditingTeam(null);
      loadTeams();
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${team.name}"? This will remove all team assignments.`
      )
    ) {
      try {
        await deleteTeam(team.id);
        toast.success("Team deleted successfully!");
        loadTeams();
      } catch (error) {
        console.error("Error deleting team:", error);
        const message =
          error instanceof Error ? error.message : "Failed to delete team";
        toast.error(message);
      }
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const handleViewTeam = (team: Team) => {
    navigate(`/app/teams/${team.id}`);
  };

  const handleCreateNew = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTeam(null);
  };

  const handleFormSubmit = async (
    data: CreateTeamRequest | UpdateTeamRequest
  ) => {
    if (editingTeam) {
      await handleUpdateTeam(data as UpdateTeamRequest);
    } else {
      await handleCreateTeam(data as CreateTeamRequest);
    }
  };

  if (!userClub) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No Club Found
        </h2>
        <p className="text-gray-600">
          You need to be associated with a club to manage teams.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Team Management
          </h1>
          <p className="text-sm text-gray-500">
            Create and manage teams for your club.
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="rounded-xl gradient-primary text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <TeamList
        teams={teams}
        onEdit={handleEditTeam}
        onDelete={handleDeleteTeam}
        onView={handleViewTeam}
        isLoading={isLoading}
      />

      <TeamForm
        isOpen={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        isEdit={!!editingTeam}
        initialData={editingTeam || undefined}
        isLoading={isSubmitting}
      />
    </div>
  );
}
