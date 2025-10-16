import { ClubSetup } from "./ClubSetup";
import { MemberSetup } from "./MemberSetup";
import { ParentSetup } from "./ParentSetup";
import { UserRole } from "@/types/auth";
import {
  CreateClubRequest,
  JoinClubAsMemberRequest,
  SetupParentAccountRequest,
} from "@/types/membership";

interface RoleSpecificSetupProps {
  selectedRole: UserRole | null;
  clubData: Partial<CreateClubRequest>;
  memberData: Partial<JoinClubAsMemberRequest>;
  parentData: Partial<SetupParentAccountRequest>;
  onClubDataUpdate: (clubData: Partial<CreateClubRequest>) => void;
  onMemberDataUpdate: (memberData: Partial<JoinClubAsMemberRequest>) => void;
  onParentDataUpdate: (parentData: Partial<SetupParentAccountRequest>) => void;
}

export function RoleSpecificSetup({
  selectedRole,
  clubData,
  memberData,
  parentData,
  onClubDataUpdate,
  onMemberDataUpdate,
  onParentDataUpdate,
}: RoleSpecificSetupProps) {
  if (selectedRole === "club_manager") {
    return (
      <ClubSetup clubData={clubData} onClubDataUpdate={onClubDataUpdate} />
    );
  } else if (selectedRole === "member") {
    return (
      <MemberSetup
        memberData={memberData}
        onMemberDataUpdate={onMemberDataUpdate}
      />
    );
  } else if (selectedRole === "parent") {
    return (
      <ParentSetup
        parentData={parentData}
        onParentDataUpdate={onParentDataUpdate}
      />
    );
  }

  return null;
}
