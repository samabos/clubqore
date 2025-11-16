import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../stores/authStore";
import { useNavigate } from "react-router-dom";
import { tokenManager } from "../../../api/secureAuth";
// import { ClubMember } from "../types/component-types";
import {
  MemberHeader,
  MemberFilters,
  MemberList,
  MemberLoading,
} from "../components";
import { useMembers } from "@/stores/membersStore";
import { useTeams } from "@/stores/teamsStore";
import { fetchTeamMembers } from "../../team/actions";
import { ClubMember } from "../types";
// import { Team } from "../../team/types";

export function ClubMemberPage() {
  const navigate = useNavigate();
  const { isAuthenticated, userClub } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterTeam, setFilterTeam] = useState("all");
  const {
    members,
    loadMembers: loadMembersFromStore,
    isLoading: isMembersLoading,
  } = useMembers();
  const teamsHook = useTeams() as unknown as {
    teams: Array<{ id: number; name: string; color?: string }>;
    loadTeams: (forceRefresh?: boolean) => Promise<void>;
    isLoading: boolean;
  };
  const {
    teams,
    loadTeams: loadTeamsFromStore,
    isLoading: isTeamsLoading,
  } = teamsHook;
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] =
    useState<Set<number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    // Only load members if user is authenticated and has a valid token
    if (!isAuthenticated || !tokenManager.getAccessToken()) {
      console.log("🔄 Skipping members load - not authenticated or no token");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Load via store (cached with TTL)
      await loadMembersFromStore();
      console.log("🔍 Members loaded via store:", members.length);
    } catch (error) {
      console.error("Failed to load members:", error);
      // Check if it's a "no club found" error
      if (
        error instanceof Error &&
        error.message &&
        error.message.includes("No club found")
      ) {
        navigate("/app/club/setup");
        return;
      }
      // Fallback to empty array if API fails
      // Store keeps previous state; nothing to set locally
    } finally {
      setIsLoading(false);
    }
  }, [navigate, isAuthenticated, loadMembersFromStore, members.length]);

  const loadTeams = useCallback(async () => {
    if (!isAuthenticated || !tokenManager.getAccessToken()) {
      return;
    }

    try {
      await loadTeamsFromStore();
    } catch (error) {
      console.error("Failed to load teams:", error);
    }
  }, [isAuthenticated, loadTeamsFromStore]);

  // Load members and teams for the current club
  useEffect(() => {
    // Only load members if user is authenticated and has a valid token
    if (isAuthenticated && tokenManager.getAccessToken()) {
      loadMembers();
      loadTeams();
    } else {
      setIsLoading(false);
    }
  }, [loadMembers, loadTeams, isAuthenticated]);

  // Ensure selected team's member IDs are loaded when filtering by a specific team
  useEffect(() => {
    if (filterTeam !== "all" && filterTeam !== "unassigned") {
      const selectedTeamId = Number(filterTeam);
      if (selectedTeamId > 0) {
        fetchTeamMembers(selectedTeamId)
          .then((tm) =>
            setSelectedTeamMemberIds(new Set(tm.map((t) => t.user_id)))
          )
          .catch(() => setSelectedTeamMemberIds(new Set()));
      } else {
        setSelectedTeamMemberIds(null);
      }
    } else {
      setSelectedTeamMemberIds(null);
    }
  }, [filterTeam]);

  // Normalize team id from various possible shapes on the member object
  const getMemberTeamId = (member: ClubMember): number | undefined => {
    // Common fields we might receive from API or transforms
    const directId = (member as unknown as { team_id?: number }).team_id;
    if (typeof directId === "number" && directId > 0) return directId;

    const camelId = (member as unknown as { teamId?: number }).teamId;
    if (typeof camelId === "number" && camelId > 0) return camelId;

    const nested = (member as unknown as { team?: { id?: number } }).team;
    if (nested && typeof nested.id === "number" && nested.id > 0)
      return nested.id;

    const assigned = (member as unknown as { assigned_team_id?: number })
      .assigned_team_id;
    if (typeof assigned === "number" && assigned > 0) return assigned;

    return undefined;
  };

  const filteredMembers = members.filter((member: ClubMember) => {
    const matchesSearch =
      (member.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.position || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (member.status || "").toLowerCase() === filterStatus.toLowerCase();

    let matchesTeam = true;
    if (filterTeam !== "all") {
      const memberTeamId = getMemberTeamId(member);
      if (filterTeam === "unassigned") {
        matchesTeam = typeof memberTeamId === "undefined";
      } else {
        const selectedTeamId = Number(filterTeam);
        const byDirectId =
          typeof memberTeamId === "number" && memberTeamId === selectedTeamId;
        const byFetchedSet = selectedTeamMemberIds?.has(member.id) ?? false;
        matchesTeam = byDirectId || byFetchedSet;
      }
    }

    return matchesSearch && matchesStatus && matchesTeam;
  });

  // Show all members individually
  const organizedMembers = filteredMembers;

  const handleEdit = (memberId: number) => {
    navigate(`/app/club/member/manage/${memberId}`);
  };

  const handleAddMember = () => {
    navigate("/app/club/member/manage");
  };

  if (isLoading || isMembersLoading || isTeamsLoading) {
    return <MemberLoading />;
  }

  return (
    <div className="space-y-6">
      <MemberHeader clubName={userClub?.name} onAddMember={handleAddMember} />

      <MemberFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterTeam={filterTeam}
        onFilterTeamChange={setFilterTeam}
        teams={teams}
      />

      <MemberList members={organizedMembers} onEdit={handleEdit} />
    </div>
  );
}
