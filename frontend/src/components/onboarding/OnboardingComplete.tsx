import { Badge } from "../ui/badge";
import {
  Baby,
  Building2,
  Calendar,
  Check,
  CreditCard,
  MessageSquare,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { UserRole } from "../../types/auth";

interface OnboardingCompleteProps {
  selectedRole: UserRole | null;
}

export function OnboardingComplete({ selectedRole }: OnboardingCompleteProps) {
  const generateAccountNumber = () => {
    return `CQ2024-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  };

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to ClubQore!
        </h2>
        <p className="text-gray-600">
          {selectedRole === "club_manager"
            ? "Your club is now set up and ready to manage your team."
            : selectedRole === "member"
            ? "Your player profile is complete. You're ready to join club activities."
            : "Your parent account is ready. You can now monitor your children's activities."}
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
        <h3 className="font-medium text-gray-900 mb-3">What's next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {selectedRole === "club_manager" ? (
            <>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Invite team members</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Schedule training sessions</span>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Set up billing plans</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Customize your club</span>
              </div>
            </>
          ) : selectedRole === "member" ? (
            <>
              <div className="flex items-center gap-3">
                <Trophy className="w-4 h-4 text-blue-600" />
                <span>View your performance</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Check your schedule</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Connect with teammates</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-blue-600" />
                <span>Update your profile</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Baby className="w-4 h-4 text-blue-600" />
                <span>Monitor children's activities</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>View schedules & events</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="w-4 h-4 text-blue-600" />
                <span>Receive important updates</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Communicate with clubs</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-blue-900 mb-1">
              Account Number Generated
            </h4>
            <p className="text-sm text-blue-800">
              Your account number{" "}
              <span className="font-mono font-bold">
                {generateAccountNumber()}
              </span>{" "}
              has been generated. You can use this for easy identification and
              support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
