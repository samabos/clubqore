import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Eye, Pencil, Trash2, UserCog } from "lucide-react";
import { TeamLoading } from "@/components/ui/loading";
import { Team } from "../types";

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
  const getManagerName = (team: Team): string => {
    if (team.manager_first_name && team.manager_last_name) {
      return `${team.manager_first_name} ${team.manager_last_name}`;
    }
    if (team.manager_first_name) {
      return team.manager_first_name;
    }
    return "Not assigned";
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No teams yet
            </h3>
            <p className="text-gray-500">
              Create your first team to organize club members
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Teams ({teams.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Team Manager</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color || "#3B82F6" }}
                    />
                    <span className="font-medium">{team.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-gray-400" />
                    <span
                      className={
                        team.manager_first_name
                          ? "text-gray-900"
                          : "text-gray-400 italic"
                      }
                    >
                      {getManagerName(team)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{team.member_count || 0}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={team.is_active ? "default" : "secondary"}
                    className={
                      team.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : ""
                    }
                  >
                    {team.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(team)}
                      title="View Members"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(team)}
                      title="Edit Team"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(team)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete Team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
