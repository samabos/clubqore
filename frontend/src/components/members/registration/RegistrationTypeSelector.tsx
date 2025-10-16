import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { UserPlus, Users, Mail, UserCheck } from "lucide-react";

interface RegistrationTypeSelectorProps {
  registrationType: "member" | "parent";
  setRegistrationType: (type: "member" | "parent") => void;
  memberEmail: string;
  setMemberEmail: (email: string) => void;
  parentEmail: string;
  setParentEmail: (email: string) => void;
  existingMember: any;
  existingParent: any;
  checkingMember: boolean;
  checkingParent: boolean;
  memberEmailVerified: boolean;
  checkEmailIsAvailable: (
    email: string,
    type: "member" | "parent"
  ) => Promise<void>;
  onProceed: () => void;
  setMemberEmailVerified: (verified: boolean) => void;
  setExistingMember: (member: any) => void;
}

export function RegistrationTypeSelector({
  registrationType,
  setRegistrationType,
  memberEmail,
  setMemberEmail,
  parentEmail,
  setParentEmail,
  existingMember,
  existingParent,
  checkingMember,
  checkingParent,
  memberEmailVerified,
  checkEmailIsAvailable,
  onProceed,
  setMemberEmailVerified,
  setExistingMember,
}: RegistrationTypeSelectorProps) {
  return (
    <Card className="border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add New Member
        </CardTitle>
        <CardDescription className="text-gray-600">
          Choose how you'd like to register new members to your club
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registration Type Selection */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              What type of registration?
            </h3>
            <p className="text-sm text-gray-600">
              Select the option that best fits your situation
            </p>
          </div>
          <RadioGroup
            value={registrationType}
            onValueChange={(value: "member" | "parent") =>
              setRegistrationType(value)
            }
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Individual Player Registration Card */}
            <div className="relative flex items-center space-x-4 border-2 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group">
              <RadioGroupItem
                value="member"
                id="member-direct"
                className="text-blue-600"
              />
              <div className="flex-1">
                <Label htmlFor="member-direct" className="cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                      <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-gray-900 block">
                        Individual Player
                      </span>
                      <span className="text-sm text-gray-500">
                        Register a single player
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Perfect for independent players who manage their own
                      account. They'll receive login details directly.
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Player gets their own account</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Login credentials sent to player's email</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>No parent dashboard needed</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-800 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Email Delivery
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Credentials → Player's Email
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </div>

            {/* Family Registration Card */}
            <div className="relative flex items-center space-x-4 border-2 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer group">
              <RadioGroupItem
                value="parent"
                id="parent-direct"
                className="text-green-600"
              />
              <div className="flex-1">
                <Label htmlFor="parent-direct" className="cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl group-hover:from-green-100 group-hover:to-green-200 transition-all">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-gray-900 block">
                        Family Account
                      </span>
                      <span className="text-sm text-gray-500">
                        Parent + multiple children
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Ideal for families with young players. Parent manages
                      everything from one dashboard and receives all
                      communications.
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Parent dashboard for all children</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Add multiple children easily</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Centralized communication hub</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 text-green-800 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Email Delivery
                        </span>
                      </div>
                      <p className="text-xs text-green-700">
                        Credentials → Parent's Email Only
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Member Email Check Section (only for member registration) */}
        {registrationType === "member" && (
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-blue-50/50">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Player Email Verification
              </h3>
              <p className="text-sm text-gray-600">
                Let's make sure this player isn't already in our system
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter the player's email address"
                  value={memberEmail}
                  onChange={(e) => {
                    setMemberEmail(e.target.value);
                    setMemberEmailVerified(false);
                    setExistingMember(null);
                  }}
                  className="rounded-xl border-blue-200 focus:border-blue-400 focus:ring-blue-100"
                />
              </div>
              <Button
                onClick={() => checkEmailIsAvailable(memberEmail, "member")}
                disabled={!memberEmail || checkingMember}
                className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700"
              >
                {checkingMember ? "Checking..." : "Verify"}
              </Button>
            </div>

            {existingMember && (
              <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                <div className="flex items-center gap-2 text-orange-800 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-semibold">Already Registered</span>
                </div>
                <p className="text-sm text-orange-700 font-medium">
                  {existingMember.firstName} {existingMember.lastName}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  This player is already in our system. Please try a different
                  email.
                </p>
              </div>
            )}

            {memberEmail &&
              !existingMember &&
              !checkingMember &&
              memberEmailVerified && (
                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold">Ready to Register</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Great! This email is available. We'll create a new player
                    account.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Parent Email Check Section (only for parent registration) */}
        {registrationType === "parent" && (
          <div className="border-2 border-dashed border-green-200 rounded-xl p-6 bg-green-50/50">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Parent Account Verification
              </h3>
              <p className="text-sm text-gray-600">
                Let's check if this parent already has an account with us
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter the parent's email address"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="rounded-xl border-green-200 focus:border-green-400 focus:ring-green-100"
                />
              </div>
              <Button
                onClick={() => checkEmailIsAvailable(parentEmail, "parent")}
                disabled={!parentEmail || checkingParent}
                className="rounded-xl px-6 bg-green-600 hover:bg-green-700"
              >
                {checkingParent ? "Checking..." : "Verify"}
              </Button>
            </div>

            {existingParent && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <UserCheck className="w-4 h-4" />
                  <span className="font-medium">Parent Found!</span>
                </div>
                <p className="text-sm text-green-700">
                  {existingParent.firstName} {existingParent.lastName} (
                  {existingParent.email})
                </p>
                <p className="text-xs text-green-600 mt-1">
                  You can add more children to this existing parent account.
                </p>
              </div>
            )}

            {parentEmail && !existingParent && !checkingParent && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <UserPlus className="w-4 h-4" />
                  <span className="font-medium">New Parent</span>
                </div>
                <p className="text-sm text-blue-700">
                  This email is not in our system. We'll create a new parent
                  account.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Process Information */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              How it works
            </h3>
            <p className="text-sm text-gray-600">
              Simple {registrationType === "member" ? "player" : "family"}{" "}
              registration in 4 easy steps
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {registrationType === "member"
                    ? "Complete Player Profile"
                    : "Set Up Family Account"}
                </p>
                <p className="text-sm text-gray-600">
                  {registrationType === "member"
                    ? "Fill out the player's information and preferences"
                    : "Add parent details and register multiple children"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Secure Account Creation
                </p>
                <p className="text-sm text-gray-600">
                  System automatically creates secure login credentials
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Email Notification</p>
                <p className="text-sm text-gray-600">
                  Login details sent to{" "}
                  {registrationType === "member"
                    ? "player's email"
                    : "parent's email only"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                ✓
              </div>
              <div>
                <p className="font-medium text-gray-900">Ready to Go!</p>
                <p className="text-sm text-gray-600">
                  {registrationType === "member"
                    ? "Player can access their dashboard and club information"
                    : "Parent can manage all children from one convenient dashboard"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center pt-6">
          <Button
            onClick={onProceed}
            disabled={
              (registrationType === "parent" && !parentEmail) ||
              (registrationType === "member" &&
                (!memberEmail || existingMember || !memberEmailVerified))
            }
            className="px-12 py-4 rounded-xl text-lg font-medium gradient-primary text-white hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {registrationType === "parent"
              ? existingParent
                ? "✨ Add Children to Family Account"
                : "🚀 Create New Family Account"
              : existingMember
              ? "❌ Player Already Registered"
              : "⚽ Register New Player"}
          </Button>

          {((registrationType === "parent" && !parentEmail) ||
            (registrationType === "member" &&
              (!memberEmail || !memberEmailVerified))) && (
            <p className="text-sm text-gray-500 mt-3">
              Please check the email address first to continue
            </p>
          )}

          {existingMember && (
            <p className="text-sm text-orange-600 mt-3">
              This player is already registered in the system
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
