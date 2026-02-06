import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, Clock, MapPin, Users } from "lucide-react";
import { parentAPI, type TrainingSession, type Match } from "@/api/parent";
import type { ChildDetailData } from "../types";
import { format, parseISO } from "date-fns";

interface ChildScheduleSectionProps {
  child: ChildDetailData;
}

type ScheduleEvent = (TrainingSession | Match) & { type: 'training' | 'match' };

export function ChildScheduleSection({ child }: ChildScheduleSectionProps) {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child.id]);

  const loadSchedule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await parentAPI.getChildSchedule(child.id.toString());
      setTrainingSessions(data.trainingSessions || []);
      setMatches(data.matches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEEE, MMM dd, yyyy");
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const allEvents: ScheduleEvent[] = [
    ...trainingSessions.map((session) => ({
      ...session,
      type: 'training' as const,
    })),
    ...matches.map((match) => ({
      ...match,
      type: 'match' as const,
    })),
  ].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.start_time}`);
    const dateB = new Date(`${b.date}T${b.start_time}`);
    return dateA.getTime() - dateB.getTime();
  });

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No upcoming events scheduled</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {allEvents.map((event) => (
        <Card
          key={`${event.type}-${event.id}`}
          className="hover:shadow-md transition-shadow"
        >
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {event.type === 'training'
                      ? (event as TrainingSession).title
                      : (event as Match).opponent
                        ? `vs ${(event as Match).opponent}`
                        : 'Match'}
                  </h3>
                  <Badge
                    variant={event.type === 'training' ? 'secondary' : 'default'}
                    className={event.type === 'match' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : ''}
                  >
                    {event.type === 'training' ? 'Training' : 'Match'}
                  </Badge>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </span>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}

              {/* Team */}
              {event.team_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event.team_name}</span>
                </div>
              )}

              {/* Match specific info */}
              {event.type === 'match' && (event as Match).opponent && (
                <div className="pt-2 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Opponent: </span>
                    <span className="font-medium">{(event as Match).opponent}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
