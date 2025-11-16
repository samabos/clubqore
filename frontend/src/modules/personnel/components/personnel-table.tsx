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
import { Plus, Edit, Trash2, Mail, Phone, User } from "lucide-react";
import { PersonnelTableProps } from "../types/component-types";
import { PersonnelLoading } from "@/components/ui/loading";

export function PersonnelTable({
  personnel,
  loading,
  onEdit,
  onDelete,
  onAddNew,
}: PersonnelTableProps) {
  if (loading) {
    return (
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Personnel List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PersonnelLoading message="Loading personnel..." />
        </CardContent>
      </Card>
    );
  }

  if (personnel.length === 0) {
    return (
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Personnel List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No personnel found
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first coach or staff member to get started
            </p>
            <Button onClick={onAddNew} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add First Personnel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Personnel List
          </CardTitle>
          <Button onClick={onAddNew} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Added</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personnel.map((person) => (
              <TableRow key={person.userRoleId}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {person.avatar ? (
                      <img
                        src={person.avatar}
                        alt={person.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{person.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {person.role}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{person.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {person.phone ? (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{person.phone}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={person.isOnboarded ? "default" : "secondary"}>
                    {person.isOnboarded ? "Active" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(person.roleCreatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(person)}
                      className="rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(person.userRoleId)}
                      className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
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
