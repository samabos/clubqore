import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Loader2, LayoutList, Calendar as CalendarIcon, Dumbbell, Trophy } from "lucide-react";
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
  cancelScheduleTrainingSession,
  cancelScheduleMatch,
  modifyTrainingOccurrence,
  editFutureTrainingOccurrences,
  editAllTrainingOccurrences,
} from "../actions/schedule-actions";
import {
  ScheduleFiltersBar,
  ScheduleCalendar,
  ScheduleTable,
  MatchForm,
  RecurringEditDialog,
} from "../components";
import type { EditScope } from "../components/recurring-edit-dialog";

export function ScheduleManagementPage() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ScheduleItem[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  // Form states
  const [createType, setCreateType] = useState<"training" | "match" | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recurring edit dialog state
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [pendingEditItem, setPendingEditItem] = useState<ScheduleItem | null>(null);
  const [editScope, setEditScope] = useState<EditScope | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ScheduleFilters>({
    type: "all",
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Table view: expand=false (database rows only)
      // Calendar view: expand=true (virtual occurrences for recurring sessions)
      const expand = viewMode === "calendar";

      const [items, seasonsData, teamsData] = await Promise.all([
        fetchScheduleItems(undefined, expand),
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
  }, [viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilters = useCallback(() => {
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
  }, [scheduleItems, filters]);

  // Apply filters whenever schedule items or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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

      // Check if this is a recurring session and we have an edit scope
      if (editingItem.data.is_recurring && editScope) {
        const sessionId = editingItem.data.id;
        const occurrenceDate = editingItem.date;

        if (editScope === "this") {
          // Modify only this occurrence
          await modifyTrainingOccurrence(sessionId, occurrenceDate, data);
          toast.success("This occurrence updated successfully!");
        } else if (editScope === "future") {
          // Edit this and future occurrences
          await editFutureTrainingOccurrences(sessionId, occurrenceDate, data);
          toast.success("This and future occurrences updated successfully!");
        } else if (editScope === "all") {
          // Edit all occurrences
          await editAllTrainingOccurrences(sessionId, data);
          toast.success("All occurrences updated successfully!");
        }
      } else {
        // Non-recurring or no scope - regular update
        await updateScheduleTrainingSession(editingItem.data.id, data);
        toast.success("Training session updated successfully!");
      }

      setEditingItem(null);
      setEditScope(null);
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

  // Cancel handler (works for both types)
  const handleCancelItem = async (item: ScheduleItem) => {
    const itemType = item.type === "training" ? "training session" : "match";
    const title = isTrainingItem(item) ? item.data.title : `${item.data.home_team_name} vs ${item.data.opponent_name || item.data.away_team_name}`;

    if (
      window.confirm(
        `Are you sure you want to cancel "${title}"? This action cannot be undone.`
      )
    ) {
      try {
        if (isTrainingItem(item)) {
          await cancelScheduleTrainingSession(item.data.id);
          toast.success(`${item.data.title} has been cancelled`);
        } else {
          await cancelScheduleMatch(item.data.id);
          toast.success("Match has been cancelled");
        }
        await loadData();
      } catch (error) {
        console.error(`Error cancelling ${itemType}:`, error);
        toast.error(`Failed to cancel ${itemType}`);
      }
    }
  };

  // Edit handler - check if recurring
  const handleEditItem = (item: ScheduleItem) => {
    // Check if this is a recurring training session AND not in draft status
    // Draft sessions should be edited directly without recurring dialog
    if (isTrainingItem(item) && item.data.is_recurring && item.status !== "draft") {
      // Show recurring edit dialog first
      setPendingEditItem(item);
      setShowRecurringDialog(true);
    } else {
      // Non-recurring OR draft - edit directly
      setEditingItem(item);
    }
  };

  // Handle recurring edit scope selection
  const handleRecurringEditScope = (scope: EditScope) => {
    setEditScope(scope);
    setShowRecurringDialog(false);

    // Now open the edit form with the scope
    if (pendingEditItem) {
      setEditingItem(pendingEditItem);
    }
  };

  const handleCloseForm = () => {
    setCreateType(null);
    setEditingItem(null);
    setEditScope(null);
    setPendingEditItem(null);
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
            onValueChange={(value) => setViewMode(value as "table" | "calendar")}
          >
            <TabsList>
              <TabsTrigger value="table" className="gap-2">
                <LayoutList className="w-4 h-4" />
                Table
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
          items={filteredItems.filter(item => item.status !== 'draft')}
          readOnly={true}
        />
      ) : (
        <ScheduleTable
          items={filteredItems}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onPublish={handlePublishItem}
          onCancel={handleCancelItem}
        />
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

      {/* Recurring Edit Dialog */}
      {pendingEditItem && isTrainingItem(pendingEditItem) && (
        <RecurringEditDialog
          open={showRecurringDialog}
          onClose={() => {
            setShowRecurringDialog(false);
            setPendingEditItem(null);
          }}
          onEditScope={handleRecurringEditScope}
          eventTitle={pendingEditItem.data.title}
          occurrenceDate={pendingEditItem.date}
          eventType="training"
        />
      )}
    </div>
  );
}
