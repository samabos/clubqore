import { Loading } from "@/components/ui/loading";

export function ClubSetupLoading() {
  return (
    <Loading
      message="Loading club information..."
      containerClassName="min-h-screen"
    />
  );
}
