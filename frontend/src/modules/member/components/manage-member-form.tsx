import { Button } from "@/components/ui/button";
import { UserPlus, Save, UserX } from "lucide-react";
import ParentInformationForm from "./parent-information-form";
import AccountSettingsForm from "./account-settings-form";
import ChildrenInformationForm from "./children-information-form";
import { ManageMemberFormProps } from "../types/component-types";

export function ManageMemberForm({
  formData,
  children,
  isLoading,
  isEditMode,
  onFormDataChange,
  onChildFieldChange,
  onAddChild,
  onRemoveChild,
  onSubmit,
  onCancel,
  onEndContract,
}: ManageMemberFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Parent Information */}
      <ParentInformationForm
        formData={{
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || "",
        }}
        updateField={onFormDataChange}
        isEditMode={isEditMode}
      />

      {/* Account Settings - Only show when creating new member */}
      {!isEditMode && (
        <AccountSettingsForm
          formData={{
            password: formData.password || "",
            generatePassword: formData.generatePassword || false,
            sendWelcomeEmail: formData.sendWelcomeEmail || false,
          }}
          updateField={onFormDataChange}
          isEditMode={isEditMode}
        />
      )}

      {/* Players Information */}
      <ChildrenInformationForm
        children={children}
        updateChildField={onChildFieldChange}
        addChild={onAddChild}
        removeChild={onRemoveChild}
        isEditMode={isEditMode}
      />

      {/* End Contract Section - Only show in edit mode */}
      {isEditMode && onEndContract && (
        <div className="border-t pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <UserX className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  End Contract
                </h3>
                <p className="text-red-700 mb-3">
                  This action will deactivate the parent account and remove all
                  children from teams.
                </p>
                <div className="bg-white border border-red-200 rounded p-3 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    This will affect:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>
                      • Parent account:{" "}
                      <span className="font-medium">
                        {formData.firstName} {formData.lastName}
                      </span>
                    </li>
                    <li>
                      • Players ({children.length}):{" "}
                      {children
                        .map((child) => `${child.firstName} ${child.lastName}`)
                        .join(", ")}
                    </li>
                    <li>• All players will be removed from their teams</li>
                    <li>
                      • Parent and players will no longer appear in active
                      member lists
                    </li>
                  </ul>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onEndContract}
                  className="rounded-xl"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  End Contract
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            isEditMode ? (
              "Updating Member..."
            ) : (
              "Creating Parent & Players..."
            )
          ) : (
            <>
              {isEditMode ? (
                <Save className="w-4 h-4 mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {isEditMode
                ? `Update Member & ${children.length} Player${
                    children.length > 1 ? "s" : ""
                  }`
                : `Create Parent & ${children.length} Player${
                    children.length > 1 ? "s" : ""
                  }`}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl px-8 py-3 border-gray-200 hover:border-gray-300"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
