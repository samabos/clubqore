import { useState } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/components/ui/utils";
import type { ScheduleItem } from "../types/schedule-types";
import { getDisplayInfo } from "../utils/schedule-utils";
import { ScheduleItemPopover } from "./schedule-item-popover";

interface ScheduleCalendarProps {
  items: ScheduleItem[];
  onEditItem?: (item: ScheduleItem) => void;
  onDeleteItem?: (item: ScheduleItem) => void;
  onPublishItem?: (item: ScheduleItem) => void;
  readOnly?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ScheduleCalendar({
  items,
  onEditItem,
  onDeleteItem,
  onPublishItem,
  readOnly = false,
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of the month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  // Get previous month's trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const trailingDays = firstDayWeekday;

  // Calculate total cells needed (6 rows × 7 days = 42)
  const totalCells = 42;
  const leadingDays = totalCells - (trailingDays + totalDays);

  // Build calendar grid
  const calendarDays: Array<{
    date: Date;
    day: number;
    isCurrentMonth: boolean;
  }> = [];

  // Previous month days
  for (let i = trailingDays - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      day: i,
      isCurrentMonth: true,
    });
  }

  // Next month days
  for (let i = 1; i <= leadingDays; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      day: i,
      isCurrentMonth: false,
    });
  }

  // Group items by date
  const itemsByDate = items.reduce((acc, item) => {
    const dateKey = new Date(item.date).toISOString().split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const getItemsForDate = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    return itemsByDate[dateKey] || [];
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-sm"
            >
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((calendarDay, index) => {
            const dayItems = getItemsForDate(calendarDay.date);
            const hasEvents = dayItems.length > 0;

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] p-2 rounded-lg border transition-colors",
                  calendarDay.isCurrentMonth
                    ? "bg-white border-gray-200"
                    : "bg-gray-50 border-gray-100",
                  isToday(calendarDay.date) &&
                    "ring-2 ring-blue-500 ring-offset-1"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    calendarDay.isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400",
                    isToday(calendarDay.date) && "text-blue-600 font-bold"
                  )}
                >
                  {calendarDay.day}
                </div>

                {/* Items for this day */}
                {hasEvents && (
                  <div className="space-y-1">
                    {dayItems.slice(0, 2).map((item) => {
                      const display = getDisplayInfo(item);
                      return (
                        <Popover key={`${item.type}-${item.id}`}>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "w-full text-left px-2 py-1 rounded text-xs font-medium text-white truncate hover:opacity-80 transition-opacity flex items-center gap-1",
                                display.color,
                                item.type === "match" &&
                                  "border-2 border-white border-dashed"
                              )}
                            >
                              {item.type === "match" ? (
                                <Trophy className="w-3 h-3 flex-shrink-0" />
                              ) : (
                                <Dumbbell className="w-3 h-3 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {display.start_time} {display.title}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="start">
                            <ScheduleItemPopover
                              item={item}
                              onEdit={onEditItem}
                              onDelete={onDeleteItem}
                              onPublish={onPublishItem}
                              readOnly={readOnly}
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    })}

                    {dayItems.length > 2 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayItems.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          {/* Training Sessions Legend */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              Training Sessions
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Training</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Practice</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">Conditioning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">Tactical</span>
              </div>
            </div>
          </div>

          {/* Matches Legend */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Matches
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
                <span className="text-gray-600">League</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-white"></div>
                <span className="text-gray-600">Cup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-600 border-2 border-white"></div>
                <span className="text-gray-600">Tournament</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-600 border-2 border-white"></div>
                <span className="text-gray-600">Scrimmage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
