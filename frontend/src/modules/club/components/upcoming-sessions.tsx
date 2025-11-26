import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Calendar, Users, Loader2 } from "lucide-react";
import { fetchUpcomingTrainingSessions } from "@/modules/training-session/actions/training-session-actions";
import type { TrainingSession } from "@/types/training-session";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export function UpcomingSessions() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await fetchUpcomingTrainingSessions(6);
        setSessions(data);
      } catch (error) {
        console.error("Failed to load upcoming sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };
  return (
    <Card className="border-0 shadow-lg rounded-xl lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Upcoming Sessions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Training sessions and activities
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-gray-200 hover:border-gray-300"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No upcoming sessions scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <div key={session.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                    <p className="text-sm text-gray-600">
                      {formatTime(session.start_time, session.end_time)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="rounded-lg">
                      {formatDate(session.date)}
                    </Badge>
                    {session.teams && session.teams.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {session.teams.length} {session.teams.length === 1 ? "team" : "teams"}
                      </div>
                    )}
                  </div>
                  {session.coach_first_name && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Coach:</span>{" "}
                        {session.coach_first_name} {session.coach_last_name}
                      </p>
                    </div>
                  )}
                  {session.location && (
                    <div className="text-xs text-gray-500">
                      📍 {session.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
