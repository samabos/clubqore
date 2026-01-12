import { Clock, MapPin, Users, User, Trophy, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ScheduleItem } from "../types/schedule-types";
import { getDisplayInfo, isTrainingItem, isMatchItem, getStatusColor } from "../utils/schedule-utils";

interface ScheduleItemPopoverProps {
  item: ScheduleItem;
  onEdit?: (item: ScheduleItem) => void;
  onDelete?: (item: ScheduleItem) => void;
  onPublish?: (item: ScheduleItem) => void;
  readOnly?: boolean;
}

export function ScheduleItemPopover({
  item,
  onEdit,
  onDelete,
  onPublish,
  readOnly = false,
}: ScheduleItemPopoverProps) {
  const display = getDisplayInfo(item);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {item.type === "training" ? (
            <Dumbbell className="w-4 h-4 text-blue-600" />
          ) : (
            <Trophy className="w-4 h-4 text-purple-600" />
          )}
          <h4 className="font-semibold text-gray-900">{display.title}</h4>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(item.status)} variant="secondary">
            {item.status}
          </Badge>
          <Badge variant="outline" className={display.badgeColor}>
            {display.badge}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-gray-600">
        {/* Time */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {display.start_time}
            {display.end_time && ` - ${display.end_time}`}
          </span>
        </div>

        {/* Venue/Location */}
        {display.venue && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{display.venue}</span>
          </div>
        )}

        {/* Teams */}
        {display.teams.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {isTrainingItem(item) ? (
                // Training: Show team badges
                item.data.teams?.map((team) => (
                  <Badge
                    key={team.id}
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: team.color || undefined,
                      color: team.color || undefined,
                    }}
                  >
                    {team.name}
                  </Badge>
                ))
              ) : (
                // Match: Show teams as text
                <span>{display.teams.join(" vs ")}</span>
              )}
            </div>
          </div>
        )}

        {/* Child name (for parent view) */}
        {item.childName && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Child: {item.childName}</span>
          </div>
        )}

        {/* Training-specific fields */}
        {isTrainingItem(item) && (
          <>
            {item.data.coach_first_name && !item.childName && (
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
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
              <div className="font-semibold text-lg text-gray-900">
                Score: {item.data.home_score} - {item.data.away_score}
              </div>
            )}
          </>
        )}

        {/* Season */}
        {item.season_name && (
          <div className="text-xs text-gray-500">Season: {item.season_name}</div>
        )}
      </div>

      {/* Actions */}
      {!readOnly && onEdit && (
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(item)}
          >
            Edit
          </Button>
          {item.status === "draft" && onPublish && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onPublish(item)}
            >
              Publish
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
