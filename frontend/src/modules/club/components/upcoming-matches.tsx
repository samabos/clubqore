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
import { Trophy, Calendar, Loader2 } from "lucide-react";
import { fetchUpcomingMatches } from "@/modules/match/actions/match-actions";
import type { Match } from "@/types/match";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export function UpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const data = await fetchUpcomingMatches(6);
        setMatches(data);
      } catch (error) {
        console.error("Failed to load upcoming matches:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getOpponentName = (match: Match) => {
    // If it's an internal scrimmage (both teams are internal)
    if (match.away_team_id && match.away_team_name) {
      return match.away_team_name;
    }
    // External opponent
    return match.opponent_name || "TBD";
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case "league":
        return "bg-blue-100 text-blue-700";
      case "cup":
        return "bg-purple-100 text-purple-700";
      case "tournament":
        return "bg-orange-100 text-orange-700";
      case "scrimmage":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card className="border-0 shadow-lg rounded-xl lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Upcoming Matches
            </CardTitle>
            <CardDescription className="text-gray-600">
              Scheduled fixtures and scrimmages
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-gray-200 hover:border-gray-300"
          >
            <Trophy className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No upcoming matches scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matches.map((match) => (
              <div key={match.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {match.home_team_name}
                      </h4>
                      <p className="text-sm text-gray-500">vs</p>
                      <h4 className="font-medium text-gray-900">
                        {getOpponentName(match)}
                      </h4>
                    </div>
                    <Badge
                      className={`rounded-lg text-xs ${getMatchTypeColor(
                        match.match_type
                      )}`}
                    >
                      {match.match_type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="rounded-lg">
                      {formatDate(match.date)}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {formatTime(match.start_time)}
                    </span>
                  </div>
                  {match.venue && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Venue:</span> {match.venue}
                      </p>
                    </div>
                  )}
                  {match.competition_name && (
                    <div className="text-xs text-gray-500">
                      🏆 {match.competition_name}
                    </div>
                  )}
                  {!match.is_home && !match.away_team_id && (
                    <div className="text-xs text-gray-500">
                      📍 Away Match
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
