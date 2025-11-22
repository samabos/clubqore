import { TeamMember } from "../types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, X } from "lucide-react";

interface TeamPlayersTableProps {
  members: TeamMember[];
  onEdit: (userId: number) => void;
  onRemove: (assignmentId: number) => void;
}

export function TeamPlayersTable({
  members,
  onEdit,
  onRemove,
}: TeamPlayersTableProps) {
  if (members.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No players assigned to this team
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>Parent</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="w-[120px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>
                    {member.first_name[0]}
                    {member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {member.first_name} {member.last_name}
                </span>
              </div>
            </TableCell>
            <TableCell>{member.parent_name || "-"}</TableCell>
            <TableCell>
              {member.assigned_at
                ? new Date(member.assigned_at).toLocaleDateString()
                : "-"}
            </TableCell>
            <TableCell>{member.parent_email || "-"}</TableCell>
            <TableCell>{member.parent_phone || "-"}</TableCell>
            <TableCell className="text-right">
              {member.status === "Active" ? (
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(member.user_id)}
                    title="Edit"
                    className="rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const name =
                        `${member.first_name} ${member.last_name}`.trim();
                      if (window.confirm(`Remove ${name} from this team?`)) {
                        onRemove(member.id);
                      }
                    }}
                    className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Remove from team"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Inactive</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
