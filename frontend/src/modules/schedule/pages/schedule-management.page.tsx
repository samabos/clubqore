import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Loader2, LayoutGrid, Calendar as CalendarIcon, Dumbbell, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchSeasons } from "@/modules/season/actions/season-actions";
import { fetchTeams } from "@/modules/team/actions";
import { TrainingSessionForm } from "@/modules/training-session/components/training-session-form";
import type { Season } from "@/types/season";
import type { Team } from "@/types/team";
import type { CreateTrainingSessionRequest } from "@/types/training-session";
import type { CreateMatchRequest } from "@/types/match";
import type { ScheduleItem, ScheduleFilters } from "../types/schedule-types";
import { isTrainingItem, isMatchItem } from "../utils/schedule-utils";
import {
  fetchScheduleItems,
  createScheduleTrainingSession,
  updateScheduleTrainingSession,
  deleteScheduleTrainingSession,
  publishScheduleTrainingSession,
  createScheduleMatch,
  updateScheduleMatch,
  deleteScheduleMatch,
  publishScheduleMatch,
} from "../actions/schedule-actions";
import {
  ScheduleFiltersBar,
  ScheduleCalendar,
  ScheduleCard,
  MatchForm,
} from "../components";

export function ScheduleManagementPage() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ScheduleItem[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("calendar");

  // Form states
  const [createType, setCreateType] = useState<"training" | "match" | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<ScheduleFilters>({
    type: "all",
  });

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters whenever schedule items or filters change
  useEffect(() => {
    applyFilters();
  }, [scheduleItems, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [items, seasonsData, teamsData] = await Promise.all([
        fetchScheduleItems(),
        fetchSeasons(),
        fetchTeams(),
      ]);
      setScheduleItems(items);
      setSeasons(seasonsData);
      setTeams(teamsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...scheduleItems];

    // Type filter
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter((item) => item.type === filters.type);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    // Season filter
    if (filters.season_id) {
      filtered = filtered.filter((item) => item.season_id === filters.season_id);
    }

    // Team filter
    if (filters.team_id) {
      filtered = filtered.filter((item) => {
        if (isTrainingItem(item)) {
          return item.data.teams?.some((t) => t.id === filters.team_id);
        } else if (isMatchItem(item)) {
          return (
            item.data.home_team_id === filters.team_id ||
            item.data.away_team_id === filters.team_id
          );
        }
        return false;
      });
    }

    // Date range filters
    if (filters.from_date) {
      filtered = filtered.filter((item) => item.date >= filters.from_date!);
    }
    if (filters.to_date) {
      filtered = filtered.filter((item) => item.date <= filters.to_date!);
    }

    // Type-specific filters
    if (filters.session_type) {
      filtered = filtered.filter((item) =>
        isTrainingItem(item) ? item.data.session_type === filters.session_type : true
      );
    }
    if (filters.match_type) {
      filtered = filtered.filter((item) =>
        isMatchItem(item) ? item.data.match_type === filters.match_type : true
      );
    }

    setFilteredItems(filtered);
  };

  // Training Session handlers
  const handleCreateTrainingSession = async (data: CreateTrainingSessionRequest) => {
    try {
      setIsSubmitting(true);
      await createScheduleTrainingSession(data);
      toast.success("Training session created successfully!");
      setCreateType(null);
      await loadData();
    } catch (error) {
      console.error("Error creating training session:", error);
      toast.error("Failed to create training session");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTrainingSession = async (data: CreateTrainingSessionRequest) => {
    if (!editingItem || !isTrainingItem(editingItem)) return;

    try {
      setIsSubmitting(true);
      await updateScheduleTrainingSession(editingItem.data.id, data);
      toast.success("Training session updated successfully!");
      setEditingItem(null);
      await loadData();
    } catch (error) {
      console.error("Error updating training session:", error);
      toast.error("Failed to update training session");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Match handlers
  const handleCreateMatch = async (data: CreateMatchRequest) => {
    try {
      setIsSubmitting(true);
      await createScheduleMatch(data);
      toast.success("Match created successfully!");
      setCreateType(null);
      await loadData();
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create match");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMatch = async (data: CreateMatchRequest) => {
    if (!editingItem || !isMatchItem(editingItem)) return;

    try {
      setIsSubmitting(true);
      await updateScheduleMatch(editingItem.data.id, data);
      toast.success("Match updated successfully!");
      setEditingItem(null);
      await loadData();
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Failed to update match");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler (works for both types)
  const handleDeleteItem = async (item: ScheduleItem) => {
    const itemType = item.type === "training" ? "training session" : "match";
    const title = isTrainingItem(item) ? item.data.title : `${item.data.home_team_name} vs ${item.data.opponent_name || item.data.away_team_name}`;

    if (
      window.confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    ) {
      try {
        if (isTrainingItem(item)) {
          await deleteScheduleTrainingSession(item.data.id);
        } else {
          await deleteScheduleMatch(item.data.id);
        }
        toast.success(`${itemType} deleted successfully!`);
        await loadData();
      } catch (error) {
        console.error(`Error deleting ${itemType}:`, error);
        toast.error(`Failed to delete ${itemType}`);
      }
    }
  };

  // Publish handler (works for both types)
  const handlePublishItem = async (item: ScheduleItem) => {
    try {
      if (isTrainingItem(item)) {
        await publishScheduleTrainingSession(item.data.id);
        toast.success(`${item.data.title} has been published`);
      } else {
        await publishScheduleMatch(item.data.id);
        toast.success("Match has been published");
      }
      await loadData();
    } catch (error) {
      console.error("Error publishing item:", error);
      toast.error("Failed to publish");
    }
  };

  // Edit handler
  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
  };

  const handleCloseForm = () => {
    setCreateType(null);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">
            Manage training sessions and matches for your teams
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "grid" | "calendar")}
          >
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Create Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCreateType("training")}>
                <Dumbbell className="mr-2 h-4 w-4" />
                Training Session
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateType("match")}>
                <Trophy className="mr-2 h-4 w-4" />
                Match
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <ScheduleFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        seasons={seasons}
        teams={teams}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          {scheduleItems.length === 0 ? (
            <>
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No scheduled items yet
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by creating a training session or match
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setCreateType("training")}>
                    <Dumbbell className="mr-2 h-4 w-4" />
                    Training Session
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreateType("match")}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Match
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No items match your filters
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters to see more results
              </p>
            </>
          )}
        </div>
      ) : viewMode === "calendar" ? (
        <ScheduleCalendar
          items={filteredItems}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onPublishItem={handlePublishItem}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ScheduleCard
              key={`${item.type}-${item.id}`}
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onPublish={handlePublishItem}
            />
          ))}
        </div>
      )}

      {/* Training Session Form */}
      <TrainingSessionForm
        session={editingItem && isTrainingItem(editingItem) ? editingItem.data : null}
        seasons={seasons}
        teams={teams}
        isOpen={createType === "training" || (editingItem !== null && isTrainingItem(editingItem))}
        onClose={handleCloseForm}
        onSubmit={
          editingItem && isTrainingItem(editingItem)
            ? handleUpdateTrainingSession
            : handleCreateTrainingSession
        }
        isSubmitting={isSubmitting}
      />

      {/* Match Form */}
      <MatchForm
        match={editingItem && isMatchItem(editingItem) ? editingItem.data : null}
        seasons={seasons}
        teams={teams}
        isOpen={createType === "match" || (editingItem !== null && isMatchItem(editingItem))}
        onClose={handleCloseForm}
        onSubmit={
          editingItem && isMatchItem(editingItem)
            ? handleUpdateMatch
            : handleCreateMatch
        }
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
