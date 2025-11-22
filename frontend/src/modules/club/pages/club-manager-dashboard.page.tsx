import { useEffect, useState } from "react";
import { useAuth } from "../../../stores/authStore";
import type { ClubMember } from "../../member/types/component-types";
import {
  ClubSetupBanner,
  DashboardHeader,
  StatsGrid,
  RecentMembers,
  AlertsPanel,
  UpcomingSessions,
  LoadingSpinner,
} from "../components";

export function ClubManagerDashboard() {
  const {
    userClub,
    clubDataLoaded,
    user,
    hasToken,
    isAuthenticated,
    reloadClubData,
  } = useAuth();
  const [members, setMembers] = useState<ClubMember[]>([]);

  // Debug club status
  console.log(
    "🏟️ Club Dashboard - userClub:",
    userClub,
    "clubDataLoaded:",
    clubDataLoaded,
    "hasToken:",
    hasToken,
    "isAuthenticated:",
    isAuthenticated,
    "user:",
    !!user
  );

  // Attempt to load club data if token is valid but club data isn't loaded
  useEffect(() => {
    if (hasToken && isAuthenticated && user && !clubDataLoaded) {
      console.log("🔄 Club Dashboard: Attempting to retrieve club data...");
      reloadClubData().catch((error: unknown) => {
        console.error("❌ Club Dashboard: Failed to reload club data:", error);
      });
    }
  }, [hasToken, isAuthenticated, user, clubDataLoaded, reloadClubData]);

  // Fetch members once for dashboard widgets
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // dynamic import to keep coupling low
        const { fetchClubMembers } = await import("../../member/actions");
        const data = await fetchClubMembers();
        if (mounted) setMembers(data);
      } catch (e) {
        console.warn("Dashboard: failed to load members", e);
        if (mounted) setMembers([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Check if user has a club setup (only after data is loaded)
  const hasClubSetup = clubDataLoaded && userClub !== null;

  // Show loading state while club data is being loaded
  if (!clubDataLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <ClubSetupBanner hasClubSetup={hasClubSetup} />
      <DashboardHeader />
      <StatsGrid members={members} />

      <UpcomingSessions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentMembers members={members} />
        <AlertsPanel />
      </div>
    </div>
  );
}
