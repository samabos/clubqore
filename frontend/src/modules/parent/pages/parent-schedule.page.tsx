import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parentAPI, type ParentScheduleResponse } from "@/api/parent";
import { ScheduleCard } from "@/modules/schedule/components/schedule-card";
import { ScheduleCalendar } from "@/modules/schedule/components/schedule-calendar";
import type { ScheduleItem, ScheduleStatus } from "@/modules/schedule/types/schedule-types";
import type { TrainingSession } from "@/types/training-session";
import type { Match } from "@/types/match";

type ViewMode = "grid" | "calendar";
type FilterType = "all" | "training" | "match";

// Transform parent API training session to club manager format
function transformTrainingSession(session: ParentScheduleResponse["trainingSessions"][0]): TrainingSession {
  return {
    id: parseInt(session.id),
    season_id: null,
    club_id: 0,
    title: session.title,
    description: session.description || null,
    session_type: session.session_type as TrainingSession["session_type"],
    date: session.date,
    start_time: session.start_time,
    end_time: session.end_time,
    location: session.location,
    coach_id: null,
    max_participants: null,
    status: session.status as TrainingSession["status"],
    created_by: 0,
    created_at: session.created_at,
    updated_at: session.updated_at,
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_days: null,
    recurrence_end_date: null,
    parent_session_id: null,
    teams: [{ id: parseInt(session.team_id), name: session.team_name, color: null }],
  };
}

// Transform parent API match to club manager format
function transformMatch(match: ParentScheduleResponse["matches"][0]): Match {
  return {
    id: parseInt(match.id),
    season_id: null,
    club_id: 0,
    match_type: match.match_type as Match["match_type"],
    home_team_id: parseInt(match.home_team_id),
    away_team_id: match.away_team_id ? parseInt(match.away_team_id) : null,
    opponent_name: match.opponent || null,
    is_home: match.is_home,
    venue: match.location,
    date: match.date,
    start_time: match.start_time,
    end_time: match.end_time || null,
    competition_name: match.competition || null,
    home_score: match.home_score ?? null,
    away_score: match.away_score ?? null,
    status: match.status as Match["status"],
    created_by: 0,
    created_at: match.created_at,
    updated_at: match.updated_at,
    home_team_name: match.team_name,
  };
}

// Transform to ScheduleItem format
function toScheduleItem(
  type: "training" | "match",
  data: TrainingSession | Match,
  childName?: string
): ScheduleItem {
  if (type === "training") {
    const session = data as TrainingSession;
    return {
      type: "training",
      id: session.id,
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      season_id: session.season_id,
      status: session.status as ScheduleStatus,
      created_at: session.created_at,
      updated_at: session.updated_at,
      season_name: session.season_name,
      childName,
      data: session,
    };
  } else {
    const match = data as Match;
    return {
      type: "match",
      id: match.id,
      date: match.date,
      start_time: match.start_time,
      end_time: match.end_time,
      season_id: match.season_id,
      status: match.status as ScheduleStatus,
      created_at: match.created_at,
      updated_at: match.updated_at,
      season_name: match.season_name,
      childName,
      data: match,
    };
  }
}

export function ParentSchedulePage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const data = await parentAPI.getChildrenSchedule();

      // Transform and combine all items
      const scheduleItems: ScheduleItem[] = [];

      // Transform training sessions
      data.trainingSessions.forEach((session) => {
        const childName = session.child_first_name && session.child_last_name
          ? `${session.child_first_name} ${session.child_last_name}`
          : undefined;
        const transformed = transformTrainingSession(session);
        scheduleItems.push(toScheduleItem("training", transformed, childName));
      });

      // Transform matches
      data.matches.forEach((match) => {
        const childName = match.child_first_name && match.child_last_name
          ? `${match.child_first_name} ${match.child_last_name}`
          : undefined;
        const transformed = transformMatch(match);
        scheduleItems.push(toScheduleItem("match", transformed, childName));
      });

      // Sort by date
      scheduleItems.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });

      setItems(scheduleItems);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
        <p className="text-gray-600">View upcoming events for your children</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="match">Matches</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No scheduled events found
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ScheduleCard
              key={`${item.type}-${item.id}`}
              item={item}
              readOnly
            />
          ))}
        </div>
      ) : (
        <ScheduleCalendar items={filteredItems} readOnly />
      )}
    </div>
  );
}
