import { Calendar, CheckCircle2, Circle, MoreVertical, Trash2, Edit } from "lucide-react";
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
import type { Season } from "@/types/season";
import { format, parseISO } from "date-fns";

interface SeasonCardProps {
  season: Season;
  onEdit: (season: Season) => void;
  onDelete: (season: Season) => void;
  onToggleActive: (season: Season) => void;
}

export function SeasonCard({
  season,
  onEdit,
  onDelete,
  onToggleActive,
}: SeasonCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {season.name}
              </CardTitle>
              {season.is_active && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Active
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(season.start_date)} - {formatDate(season.end_date)}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(season)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Season
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(season)}>
                {season.is_active ? (
                  <>
                    <Circle className="mr-2 h-4 w-4" />
                    Mark as Inactive
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Set as Active
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(season)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Season
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">
              {season.session_count || 0}
            </p>
            <p className="text-sm text-blue-600">Training Sessions</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">
              {season.match_count || 0}
            </p>
            <p className="text-sm text-purple-600">Matches</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
