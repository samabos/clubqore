import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Season } from "@/types/season";
import type { Team } from "@/types/team";
import type { ScheduleFilters } from "../types/schedule-types";

interface ScheduleFiltersBarProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  seasons: Season[];
  teams: Team[];
}

export function ScheduleFiltersBar({
  filters,
  onFiltersChange,
  seasons,
  teams,
}: ScheduleFiltersBarProps) {
  const updateFilter = (key: keyof ScheduleFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" || value === "" ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      type: "all",
    });
  };

  const hasActiveFilters =
    filters.type !== "all" ||
    filters.status ||
    filters.season_id ||
    filters.team_id ||
    filters.from_date ||
    filters.to_date ||
    filters.match_type ||
    filters.session_type;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Primary Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Type Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Type</Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => updateFilter("type", value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="match">Match</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Status</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => updateFilter("status", value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Season Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Season</Label>
          <Select
            value={filters.season_id?.toString() || "all"}
            onValueChange={(value) =>
              updateFilter("season_id", value === "all" ? undefined : parseInt(value))
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id.toString()}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Team</Label>
          <Select
            value={filters.team_id?.toString() || "all"}
            onValueChange={(value) =>
              updateFilter("team_id", value === "all" ? undefined : parseInt(value))
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From Date */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">From Date</Label>
          <Input
            type="date"
            className="h-9"
            value={filters.from_date || ""}
            onChange={(e) => updateFilter("from_date", e.target.value)}
          />
        </div>

        {/* To Date */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">To Date</Label>
          <Input
            type="date"
            className="h-9"
            value={filters.to_date || ""}
            onChange={(e) => updateFilter("to_date", e.target.value)}
          />
        </div>
      </div>

      {/* Secondary Filters Row - Conditional based on type */}
      {(filters.type === "training" || filters.type === "match") && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2 border-t border-gray-100">
          {/* Session Type Filter - Only for Training */}
          {filters.type === "training" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Session Type</Label>
              <Select
                value={filters.session_type || "all"}
                onValueChange={(value) => updateFilter("session_type", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="conditioning">Conditioning</SelectItem>
                  <SelectItem value="tactical">Tactical</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Match Type Filter - Only for Matches */}
          {filters.type === "match" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Match Type</Label>
              <Select
                value={filters.match_type || "all"}
                onValueChange={(value) => updateFilter("match_type", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="league">League</SelectItem>
                  <SelectItem value="cup">Cup</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="scrimmage">Scrimmage</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-9 gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Clear Filters - Show when no type selected but other filters active */}
      {filters.type === "all" && hasActiveFilters && (
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-9 gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
