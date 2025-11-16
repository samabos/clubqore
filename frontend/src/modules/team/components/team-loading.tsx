import { TeamLoading as GlobalTeamLoading } from "@/components/ui/loading";

export function TeamLoading() {
  return <GlobalTeamLoading />;
}

export function TeamListLoading() {
  return <GlobalTeamLoading message="Loading teams..." />;
}

export function TeamDetailsLoading() {
  return <GlobalTeamLoading message="Loading team details..." />;
}
