import { Button } from "../../../components/ui/button";
import { Check, Save } from "lucide-react";
import { ClubSetupActionsProps } from "../types/component-types";

export function ClubSetupActions({
  isUpdateMode,
  isLoading,
  isFormValid,
}: ClubSetupActionsProps) {
  return (
    <div className="flex gap-4 pt-6 border-t border-gray-100">
      <Button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity"
      >
        {isLoading ? (
          isUpdateMode ? (
            "Updating Club..."
          ) : (
            "Creating Club..."
          )
        ) : (
          <>
            {isUpdateMode ? (
              <Save className="w-4 h-4 mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {isUpdateMode ? "Update Club" : "Create Club"}
          </>
        )}
      </Button>
    </div>
  );
}
