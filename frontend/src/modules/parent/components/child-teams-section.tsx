import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Hash, Calendar } from "lucide-react";
import type { ChildDetailData } from "../types";

interface ChildTeamsSectionProps {
  child: ChildDetailData;
}

export function ChildTeamsSection({ child }: ChildTeamsSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (child.teams.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Not assigned to any teams yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {child.teams.map((team) => (
        <Card key={team.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{team.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {child.position && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Position:</span>
                <span className="font-medium">{child.position}</span>
              </div>
            )}

            {team.assigned_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium">{formatDate(team.assigned_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
