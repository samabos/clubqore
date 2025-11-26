import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
  setActiveSeason,
} from "../actions/season-actions";
import type { Season, CreateSeasonRequest } from "@/types/season";
import { SeasonForm, SeasonCard } from "../components";

export function SeasonManagementPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSeasons();
      setSeasons(data);
    } catch (error) {
      console.error("Error loading seasons:", error);
      toast.error("Failed to load seasons");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSeason = async (data: CreateSeasonRequest) => {
    try {
      setIsSubmitting(true);
      await createSeason(data);
      toast.success("Season created successfully!");
      setIsFormOpen(false);
      await loadSeasons();
    } catch (error) {
      console.error("Error creating season:", error);
      toast.error("Failed to create season");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSeason = async (data: CreateSeasonRequest) => {
    if (!editingSeason) return;

    try {
      setIsSubmitting(true);
      await updateSeason(editingSeason.id, data);
      toast.success("Season updated successfully!");
      setIsFormOpen(false);
      setEditingSeason(null);
      await loadSeasons();
    } catch (error) {
      console.error("Error updating season:", error);
      toast.error("Failed to update season");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeason = async (season: Season) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${season.name}"? This will remove all associated sessions and matches.`
      )
    ) {
      try {
        await deleteSeason(season.id);
        toast.success("Season deleted successfully!");
        await loadSeasons();
      } catch (error) {
        console.error("Error deleting season:", error);
        const message =
          error instanceof Error ? error.message : "Failed to delete season";
        toast.error(message);
      }
    }
  };

  const handleToggleActive = async (season: Season) => {
    try {
      if (!season.is_active) {
        // Activate this season (will deactivate all others)
        await setActiveSeason(season.id);
        toast.success(`${season.name} is now the active season`);
        await loadSeasons();
      } else {
        // Deactivate this season
        await updateSeason(season.id, { is_active: false });
        toast.success(`${season.name} has been deactivated`);
        await loadSeasons();
      }
    } catch (error) {
      console.error("Error toggling active season:", error);
      toast.error("Failed to update active season");
    }
  };

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSeason(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Season Management</h1>
          <p className="text-gray-600 mt-1">
            Organize training sessions and matches by season
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Season
        </Button>
      </div>

      {/* Seasons Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No seasons yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first season
          </p>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Season
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seasons.map((season) => (
            <SeasonCard
              key={season.id}
              season={season}
              onEdit={handleEditSeason}
              onDelete={handleDeleteSeason}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Season Form Dialog */}
      <SeasonForm
        season={editingSeason}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingSeason ? handleUpdateSeason : handleCreateSeason}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
