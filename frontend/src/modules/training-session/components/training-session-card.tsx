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
import type { TrainingSession } from "@/types/training-session";
import { getRelativeDateLabel } from "@/utils/dateUtils";

interface TrainingSessionCardProps {
  session: TrainingSession;
  onEdit: (session: TrainingSession) => void;
  onDelete: (session: TrainingSession) => void;
  onPublish?: (session: TrainingSession) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "published":
      return "bg-green-100 text-green-700";
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-purple-100 text-purple-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "training":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "practice":
      return "bg-green-50 text-green-700 border-green-200";
    case "conditioning":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "tactical":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "friendly":
      return "bg-pink-50 text-pink-700 border-pink-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export function TrainingSessionCard({
  session,
  onEdit,
  onDelete,
  onPublish,
}: TrainingSessionCardProps) {
  return (
    <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {session.title}
              </CardTitle>
            </div>
            <CardDescription className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-3.5 h-3.5" />
              {getRelativeDateLabel(session.date)}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(session)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Session
              </DropdownMenuItem>
              {session.status === "draft" && onPublish && (
                <DropdownMenuItem onClick={() => onPublish(session)}>
                  <Send className="mr-2 h-4 w-4" />
                  Publish Session
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(session)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 mt-2">
          <Badge className={getStatusColor(session.status)}>
            {session.status}
          </Badge>
          <Badge variant="outline" className={getTypeColor(session.session_type)}>
            {session.session_type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {session.start_time} - {session.end_time}
            </span>
          </div>

          {/* Location */}
          {session.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{session.location}</span>
            </div>
          )}

          {/* Coach */}
          {session.coach_first_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>
                Coach: {session.coach_first_name} {session.coach_last_name}
              </span>
            </div>
          )}

          {/* Teams */}
          {session.teams && session.teams.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Teams ({session.teams.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {session.teams.map((team) => (
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
            </div>
          )}

          {/* Max Participants */}
          {session.max_participants && (
            <div className="text-xs text-gray-500">
              Max Participants: {session.max_participants}
            </div>
          )}

          {/* Season */}
          {session.season_name && (
            <div className="text-xs text-gray-500">
              Season: {session.season_name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
