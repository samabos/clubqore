import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { TeamLoading } from "@/components/ui/loading";
import { Team } from "../types";
import { TeamCard } from "./team-card";

interface TeamListProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onView: (team: Team) => void;
  isLoading?: boolean;
}

export function TeamList({
  teams,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: TeamListProps) {
  if (isLoading) {
    return (
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeamLoading message="Loading teams..." />
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No teams found
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first team to organize club members
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Teams ({teams.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
