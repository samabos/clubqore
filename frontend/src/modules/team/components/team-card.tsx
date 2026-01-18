import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  UserCog,
  Eye,
  Volleyball,
  CreditCard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Team } from "../types";
import "./team-card.css";

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onView: (team: Team) => void;
}

export function TeamCard({ team, onEdit, onDelete, onView }: TeamCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price);
  };

  return (
    <Card
      className={`team-card group border border-gray-200 ${
        team.color ? "team-card-gradient" : "team-card-default"
      }`}
      style={
        {
          "--team-color": team.color || "#3B82F6",
          "--team-color-cc": team.color
            ? `${team.color}CC`
            : "#3B82F6CC",
          "--team-color-99": team.color
            ? `${team.color}99`
            : "#3B82F699",
          "--team-color-40": team.color
            ? `${team.color}40`
            : "#3B82F640",
          "--team-text-color": team.color ? "#FFFFFF" : "#111827",
          "--team-icon-color": team.color ? "#FFFFFF" : "#6B7280",
          "--team-icon-bg": team.color
            ? "rgba(255,255,255,0.2)"
            : "#F3F4F6",
          "--team-border-color": team.color
            ? "rgba(255,255,255,0.3)"
            : "#E5E7EB",
        } as React.CSSProperties
      }
    >
      {/* Gradient overlay for extra depth */}
      {team.color && <div className="team-card-overlay" />}
      <CardHeader className="pb-4 team-card-content">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Simple football icon with team color */}
            <div className="relative">
              <div className="team-card-icon">
                <Volleyball className="w-8 h-8" />
                {/* Highlight effect */}
                <div
                  className="absolute inset-0 w-8 h-8 rounded-full opacity-20"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 50%)`,
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <CardTitle className="team-card-title">
                {team.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={team.is_active ? "default" : "secondary"}
                  className={`text-xs font-medium ${
                    team.is_active
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {team.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="team-card-menu-button h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(team)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(team)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(team)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 team-card-content">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group/manager"
                onClick={() => onEdit(team)}
                title="Click to edit team manager"
              >
                <div className="team-card-icon-container group-hover/manager:bg-white/20">
                  <UserCog className="w-3.5 h-3.5 group-hover/manager:text-primary" />
                </div>
                <span className="team-card-text group-hover/manager:text-primary">
                  {team.manager_first_name && team.manager_last_name
                    ? `${team.manager_first_name} ${team.manager_last_name}`
                    : "Not assigned yet"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="team-card-icon-container">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="team-card-text">
                  {team.member_count || 0} players
                </span>
              </div>
            </div>
          </div>

          {/* Membership Tier Info */}
          <div className="flex items-center gap-2 text-sm">
            <div className="team-card-icon-container">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <span className="team-card-text">
              {team.membership_tier_name
                ? `${team.membership_tier_name} - ${formatPrice(team.membership_tier_monthly_price || 0)}/mo`
                : "No tier assigned"}
            </span>
          </div>

          <div className="team-card-separator pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(team)}
              className="w-full rounded-lg hover:bg-gray-50 transition-colors group/btn"
            >
              <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
              View Team
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
