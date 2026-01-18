import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Calendar, Receipt, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EnrichedChild } from "../types";

interface ChildrenTableProps {
  children: EnrichedChild[];
  isLoading?: boolean;
}

export function ChildrenTable({ children, isLoading }: ChildrenTableProps) {
  const navigate = useNavigate();

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleViewDetails = (child: EnrichedChild) => {
    navigate(`/app/parent/children/${child.id}`);
  };

  const handleViewSchedule = (child: EnrichedChild) => {
    navigate(`/app/parent/children/${child.id}?tab=schedule`);
  };

  const handleViewInvoices = (child: EnrichedChild) => {
    navigate(`/app/parent/children/${child.id}?tab=invoices`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">No children found</p>
        <p className="text-sm text-muted-foreground">
          Click the "Add Child" button above to add your first child.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead>Position</TableHead>
            <TableHead className="text-center">Upcoming Events</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {children.map((child) => (
            <TableRow
              key={child.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleViewDetails(child)}
            >
              <TableCell>
                <Avatar>
                  <AvatarImage src={child.profileImage || undefined} alt={`${child.firstName} ${child.lastName}`} />
                  <AvatarFallback>{getInitials(child.firstName, child.lastName)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                {child.firstName} {child.lastName}
              </TableCell>
              <TableCell>{calculateAge(child.dateOfBirth)} years</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {child.teams.length > 0 ? (
                    child.teams.slice(0, 2).map((team) => (
                      <Badge key={team.id} variant="secondary" className="text-xs">
                        {team.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No teams</span>
                  )}
                  {child.teams.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{child.teams.length - 2} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{child.position || "-"}</span>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="text-xs">
                  {child.upcomingEventsCount}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(child);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleViewSchedule(child);
                    }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      View Schedule
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleViewInvoices(child);
                    }}>
                      <Receipt className="h-4 w-4 mr-2" />
                      View Invoices
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
