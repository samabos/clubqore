import { ClubSetupHeaderProps } from "../types/component-types";

export function ClubSetupHeader({ isUpdateMode }: ClubSetupHeaderProps) {
  return (
    <div className="mb-8">
      <div className="text-left">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {isUpdateMode ? "Update Your Club" : "Set Up Your Club"}
        </h1>
        <p className="text-sm text-gray-500">
          {isUpdateMode
            ? "Update your football club profile and settings"
            : "Create your football club profile to start managing members and activities"}
        </p>
      </div>
    </div>
  );
}
