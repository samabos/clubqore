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
import { parentAPI } from "@/api/parent";
import { ScheduleCard } from "@/modules/schedule/components/schedule-card";
import { ScheduleCalendar } from "@/modules/schedule/components/schedule-calendar";
import type { ScheduleItem } from "@/modules/schedule/types/schedule-types";
import { parentEventToScheduleItem, type ParentEventData } from "@/modules/schedule/utils/schedule-utils";

type ViewMode = "grid" | "calendar";
type FilterType = "all" | "training" | "match";

export function ParentSchedulePage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const data = await parentAPI.getChildrenSchedule();

      // Transform and combine all items using shared utility
      const scheduleItems: ScheduleItem[] = [];

      // Transform training sessions
      data.trainingSessions.forEach((session) => {
        const eventData: ParentEventData = {
          id: session.id,
          type: 'training',
          date: session.date,
          start_time: session.start_time,
          end_time: session.end_time,
          location: session.location,
          team_name: session.team_name,
          child_first_name: session.child_first_name,
          child_last_name: session.child_last_name,
          children: session.children,
          title: session.title,
          session_type: session.session_type,
        };
        scheduleItems.push(parentEventToScheduleItem(eventData));
      });

      // Transform matches
      data.matches.forEach((match) => {
        const eventData: ParentEventData = {
          id: match.id,
          type: 'match',
          date: match.date,
          start_time: match.start_time,
          end_time: match.end_time || null,
          location: match.location,
          team_name: match.team_name,
          child_first_name: match.child_first_name,
          child_last_name: match.child_last_name,
          children: match.children,
          opponent: match.opponent,
          is_home: match.is_home,
          match_type: match.match_type,
        };
        scheduleItems.push(parentEventToScheduleItem(eventData));
      });

      // Sort by date
      scheduleItems.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });

      setItems(scheduleItems);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load schedule";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items (exclude draft status - draft is for club management only)
  const filteredItems = items.filter((item) => {
    // Exclude draft items - parents can see scheduled, in_progress, completed, and cancelled events
    if (item.status === "draft") return false;

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
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No scheduled events found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Events will appear here once your children are assigned to teams
            and the club schedules training sessions or matches.
          </p>
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
