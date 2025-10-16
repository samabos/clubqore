import { Building2, Trophy, Baby, Check } from "lucide-react";
import { UserRole } from "../../types/auth";

interface RoleSelectionProps {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
}

export function RoleSelection({
  selectedRole,
  onRoleSelect,
}: RoleSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          How will you use ClubQore?
        </h2>
        <p className="text-gray-600">
          Choose the option that best describes your role
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Club Manager Option */}
        <div
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedRole === "club_manager"
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-gray-200 hover:border-gray-300 hover:shadow-md"
          }`}
          onClick={() => onRoleSelect("club_manager")}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedRole === "club_manager"
                  ? "bg-primary text-white"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Club Manager</h3>
              <p className="text-sm text-gray-600 mb-3">
                I want to create and manage a football club, handling members
                and activities.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Create and manage your club</li>
                <li>• Manage team members and registrations</li>
                <li>• Schedule training sessions and matches</li>
                <li>• Handle billing and payments</li>
                <li>• Communicate with players and parents</li>
              </ul>
            </div>
            {selectedRole === "club_manager" && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Member Option */}
        <div
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedRole === "member"
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-gray-200 hover:border-gray-300 hover:shadow-md"
          }`}
          onClick={() => onRoleSelect("member")}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedRole === "member"
                  ? "bg-primary text-white"
                  : "bg-green-50 text-green-600"
              }`}
            >
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Club Member</h3>
              <p className="text-sm text-gray-600 mb-3">
                I'm a player who wants to join a football club and track my
                activities.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Join clubs using invite codes</li>
                <li>• View training schedules and matches</li>
                <li>• Track attendance and performance</li>
                <li>• Communicate with coaches and teammates</li>
              </ul>
            </div>
            {selectedRole === "member" && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Parent Option */}
        <div
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedRole === "parent"
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-gray-200 hover:border-gray-300 hover:shadow-md"
          }`}
          onClick={() => onRoleSelect("parent")}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedRole === "parent"
                  ? "bg-primary text-white"
                  : "bg-purple-50 text-purple-600"
              }`}
            >
              <Baby className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Parent/Guardian
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                I'm a parent who wants to monitor my child's football activities
                and stay connected.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Monitor children's activities and progress</li>
                <li>• Receive updates about schedules and events</li>
                <li>• Manage payments and fees</li>
                <li>• Communicate with coaches and clubs</li>
              </ul>
            </div>
            {selectedRole === "parent" && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedRole && (
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              {selectedRole === "club_manager" ? (
                <Building2 className="w-4 h-4 text-white" />
              ) : selectedRole === "member" ? (
                <Trophy className="w-4 h-4 text-white" />
              ) : (
                <Baby className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Great choice!</h4>
              <p className="text-sm text-blue-800">
                We'll customize your ClubQore experience for
                {selectedRole === "club_manager"
                  ? " club management"
                  : selectedRole === "member"
                  ? " member activities"
                  : " parent monitoring"}
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
