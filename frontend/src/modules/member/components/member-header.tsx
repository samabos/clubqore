import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import { MemberHeaderProps } from "../types/component-types";

export function MemberHeader({ clubName, onAddMember, onInviteParent }: MemberHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Club Member</h1>
        <p className="text-sm text-gray-500">
          Manage members for {clubName || "your club"}
        </p>
      </div>
      <div className="flex gap-2">
        {onInviteParent && (
          <Button
            onClick={onInviteParent}
            variant="outline"
            className="rounded-xl"
          >
            <Mail className="w-4 h-4 mr-2" />
            Invite Parent
          </Button>
        )}
        <Button
          onClick={onAddMember}
          className="rounded-xl gradient-primary text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>
    </div>
  );
}
