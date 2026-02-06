import { useState } from "react";
import { Dumbbell, Trophy, MoreHorizontal, Pencil, Trash, Repeat, Send, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScheduleItem } from "../types/schedule-types";
import { isTrainingItem, isMatchItem } from "../utils/schedule-utils";

interface ScheduleTableProps {
  items: ScheduleItem[];
  onEdit: (item: ScheduleItem) => void;
  onDelete: (item: ScheduleItem) => void;
  onPublish: (item: ScheduleItem) => void;
  onCancel: (item: ScheduleItem) => void;
}

export function ScheduleTable({ items, onEdit, onDelete, onPublish, onCancel }: ScheduleTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortColumn) return 0;

    let aVal: string | number | undefined;
    let bVal: string | number | undefined;

    switch (sortColumn) {
      case "type":
        aVal = a.type;
        bVal = b.type;
        break;
      case "date":
        aVal = a.date;
        bVal = b.date;
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeRange = (startTime: string, endTime: string | null | undefined) => {
    if (!endTime) return startTime;
    return `${startTime} - ${endTime}`;
  };

  const getEventTitle = (item: ScheduleItem) => {
    if (isTrainingItem(item)) {
      return item.data.title;
    } else if (isMatchItem(item)) {
      const homeTeam = item.data.home_team || "Home";
      const opponent = item.data.opponent_name || "Opponent";
      return item.data.is_home ? `${homeTeam} vs ${opponent}` : `${opponent} vs ${homeTeam}`;
    }
    return "";
  };

  const getLocation = (item: ScheduleItem) => {
    if (isTrainingItem(item)) {
      return item.data.location || "-";
    } else if (isMatchItem(item)) {
      return item.data.venue || "-";
    }
    return "-";
  };

  const getTeamsDisplay = (item: ScheduleItem) => {
    if (item.teams && item.teams.length > 0) {
      return item.teams.map((t) => t.name).join(", ");
    }
    return "-";
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("type")}
            >
              Type
              {sortColumn === "type" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Event</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("date")}
            >
              Date
              {sortColumn === "date" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("status")}
            >
              Status
              {sortColumn === "status" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                No schedule items found
              </TableCell>
            </TableRow>
          ) : (
            sortedItems.map((item) => (
              <TableRow key={`${item.type}-${item.id}-${item.date}`} className="hover:bg-gray-50">
                {/* Type column with icon and badge */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isTrainingItem(item) ? (
                      <Dumbbell className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Trophy className="h-4 w-4 text-emerald-600" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {isTrainingItem(item)
                        ? item.data.session_type
                        : item.data.match_type}
                    </Badge>
                  </div>
                </TableCell>

                {/* Event title with recurring indicator */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isTrainingItem(item) && item.data.is_recurring && (
                      <Repeat className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="font-medium">{getEventTitle(item)}</span>
                  </div>
                </TableCell>

                {/* Date */}
                <TableCell>{formatDate(item.date)}</TableCell>

                {/* Time range */}
                <TableCell className="text-sm text-gray-600">
                  {formatTimeRange(item.start_time, item.end_time)}
                </TableCell>

                {/* Location */}
                <TableCell className="text-sm text-gray-600">
                  {getLocation(item)}
                </TableCell>

                {/* Teams */}
                <TableCell className="text-sm text-gray-600">
                  {getTeamsDisplay(item)}
                </TableCell>

                {/* Status badge */}
                <TableCell>
                  <Badge
                    variant={
                      item.status === "draft" ? "secondary" :
                      item.status === "scheduled" ? "default" :
                      "destructive"
                    }
                    className={item.status === "cancelled" ? "opacity-60" : ""}
                  >
                    {item.status}
                  </Badge>
                </TableCell>

                {/* Actions dropdown - hide for cancelled items */}
                <TableCell className="text-right">
                  {item.status !== "cancelled" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.status === "draft" && (
                          <>
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPublish(item)}>
                              <Send className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {item.status === "scheduled" && (
                          <DropdownMenuItem
                            onClick={() => onCancel(item)}
                            className="text-orange-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Event
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
