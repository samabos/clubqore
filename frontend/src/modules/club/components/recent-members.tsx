import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { ClubMember } from "../../member/types/component-types";

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTimeAgo = (iso?: string) => {
  if (!iso) return "";
  const now = new Date().getTime();
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

interface RecentMembersProps {
  members?: ClubMember[];
}

export function RecentMembers({ members }: RecentMembersProps) {
  const [recentPlayers, setRecentPlayers] = useState<ClubMember[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const source = members || [];
    const players = source
      .filter((m) => m.membershipType === "member" && m.status === "Active")
      .sort((a, b) => {
        const aDate = a.joinDate ? new Date(a.joinDate).getTime() : 0;
        const bDate = b.joinDate ? new Date(b.joinDate).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 3);
    setRecentPlayers(players);
  }, [members]);

  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Recent Players
            </CardTitle>
            <CardDescription className="text-gray-600">
              Latest player registrations
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={() => navigate("/app/club/members")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentPlayers.length === 0 && (
          <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-xl">
            No recent players to display.
          </div>
        )}
        {recentPlayers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 rounded-xl">
                <AvatarImage
                  src={member.profileImage}
                  className="rounded-xl object-cover"
                />
                <AvatarFallback
                  className="rounded-xl text-white"
                  style={{ backgroundColor: member.team_color || "#6366F1" }}
                >
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  {member.name}
                  {member.team_name && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border"
                      style={{
                        color: member.team_color || "#374151",
                        borderColor: member.team_color || "#E5E7EB",
                        backgroundColor:
                          (member.team_color || "#9CA3AF") + "1A",
                      }}
                      title={member.team_name}
                    >
                      {member.team_name}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">{member.email || ""}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge
                variant={member.status === "Active" ? "default" : "secondary"}
                className="rounded-lg mb-1"
              >
                {member.status}
              </Badge>
              <p
                className="text-xs text-gray-500"
                title={formatDate(member.joinDate)}
              >
                {formatTimeAgo(member.joinDate)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
