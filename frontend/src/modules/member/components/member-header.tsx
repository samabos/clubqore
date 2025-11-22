import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MemberHeaderProps } from "../types/component-types";

export function MemberHeader({ clubName, onAddMember }: MemberHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Club Parents</h1>
        <p className="text-sm text-gray-500">
          Manage members for {clubName || "your club"}
        </p>
      </div>
      <Button
        onClick={onAddMember}
        className="rounded-xl gradient-primary text-white hover:opacity-90"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Member
      </Button>
    </div>
  );
}
