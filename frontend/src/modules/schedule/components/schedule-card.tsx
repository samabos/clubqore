import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Dumbbell,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { ScheduleItem } from "../types/schedule-types";
import { getDisplayInfo, isTrainingItem, isMatchItem, getStatusColor } from "../utils/schedule-utils";
import { getRelativeDateLabel } from "@/utils/dateUtils";

interface ScheduleCardProps {
  item: ScheduleItem;
  onEdit?: (item: ScheduleItem) => void;
  onDelete?: (item: ScheduleItem) => void;
  onPublish?: (item: ScheduleItem) => void;
  readOnly?: boolean;
}

export function ScheduleCard({
  item,
  onEdit,
  onDelete,
  onPublish,
  readOnly = false,
}: ScheduleCardProps) {
  const display = getDisplayInfo(item);

  return (
    <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Type indicator icon */}
            <div className="flex items-center gap-2 mb-2">
              {item.type === "training" ? (
                <Dumbbell className="w-5 h-5 text-blue-600" />
              ) : (
                <Trophy className="w-5 h-5 text-purple-600" />
              )}
              <Badge variant="outline" className={cn("text-xs", display.badgeColor)}>
                {display.badge}
              </Badge>
            </div>

            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {display.title}
              </CardTitle>
            </div>

            {/* Date */}
            <CardDescription className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-3.5 h-3.5" />
              {getRelativeDateLabel(item.date)}
            </CardDescription>
          </div>

          {/* Actions Menu */}
          {!readOnly && onEdit && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit {item.type === "training" ? "Session" : "Match"}
                </DropdownMenuItem>
                {item.status === "draft" && onPublish && (
                  <DropdownMenuItem onClick={() => onPublish(item)}>
                    <Send className="mr-2 h-4 w-4" />
                    Publish {item.type === "training" ? "Session" : "Match"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {item.type === "training" ? "Session" : "Match"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex gap-2 mt-2">
          <Badge className={getStatusColor(item.status)}>
            {item.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {display.start_time}
              {display.end_time && ` - ${display.end_time}`}
            </span>
          </div>

          {/* Venue/Location */}
          {display.venue && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{display.venue}</span>
            </div>
          )}

          {/* Teams */}
          {display.teams.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Teams</span>
              </div>
              {isTrainingItem(item) ? (
                <div className="flex flex-wrap gap-2">
                  {item.data.teams?.map((team) => (
                    <Badge
                      key={team.id}
                      variant="outline"
                      className="rounded-lg"
                      style={{
                        borderColor: team.color || undefined,
                        color: team.color || undefined,
                      }}
                    >
                      {team.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  {display.teams.join(" vs ")}
                </div>
              )}
            </div>
          )}

          {/* Child name (for parent view) */}
          {item.childName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>Child: {item.childName}</span>
            </div>
          )}

          {/* Training-specific fields */}
          {isTrainingItem(item) && (
            <>
              {item.data.coach_first_name && !item.childName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>
                    Coach: {item.data.coach_first_name} {item.data.coach_last_name}
                  </span>
                </div>
              )}
              {item.data.max_participants && (
                <div className="text-xs text-gray-500">
                  Max Participants: {item.data.max_participants}
                </div>
              )}
            </>
          )}

          {/* Match-specific fields */}
          {isMatchItem(item) && (
            <>
              {item.data.competition_name && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy className="w-4 h-4" />
                  <span>{item.data.competition_name}</span>
                </div>
              )}
              {!item.data.is_home && (
                <Badge variant="outline" className="text-xs">
                  Away Match
                </Badge>
              )}
              {item.data.home_score !== null && item.data.away_score !== null && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Final Score</span>
                  <span className="font-semibold text-lg text-gray-900">
                    {item.data.home_score} - {item.data.away_score}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Season */}
          {item.season_name && (
            <div className="text-xs text-gray-500">
              Season: {item.season_name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
