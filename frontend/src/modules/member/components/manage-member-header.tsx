import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, Save } from "lucide-react";
import { ManageMemberHeaderProps } from "../types/component-types";

export function ManageMemberHeader({
  isEditMode,
  onBack,
}: ManageMemberHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="rounded-xl"
        title="Back to Members"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {isEditMode ? (
            <Save className="w-6 h-6" />
          ) : (
            <UserPlus className="w-6 h-6" />
          )}
          {isEditMode ? "Edit Member & Children" : "Register Parent & Children"}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? "Update member information and children details"
            : "Register a parent account with login credentials and add their children as club members"}
        </p>
      </div>
    </div>
  );
}
