import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Mail, UserCheck, Plus } from "lucide-react";
import { RegistrationForm } from "./RegistrationForm.tsx";
import { ChildRegistrationForm } from "./ChildRegistrationForm.tsx";
import { RegistrationTypeSelector } from "./RegistrationTypeSelector.tsx";
import { emailVerificationAPI } from "@/api/auth.ts";
import { toast } from "sonner";

export function DirectRegistration() {
  const [registrationType, setRegistrationType] = useState<"member" | "parent">(
    "member"
  );
  const [showForm, setShowForm] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [existingParent, setExistingParent] = useState<any>(null);
  const [checkingParent, setCheckingParent] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [existingMember, setExistingMember] = useState<any>(null);
  const [checkingMember, setCheckingMember] = useState(false);
  const [memberEmailVerified, setMemberEmailVerified] = useState(false);
  const [childrenToRegister, setChildrenToRegister] = useState([
    { id: 1, formData: null },
  ]);

  // Check if email is available for registration
  const checkEmailIsAvailable = async (
    email: string,
    type: "member" | "parent"
  ) => {
    if (type === "member") {
      setCheckingMember(true);
      setMemberEmailVerified(false);
    } else {
      setCheckingParent(true);
    }

    try {
      // Use the same API for both member and parent email checking
      const isAvailable = await emailVerificationAPI.isEmailAvailable(email);

      if (type === "member") {
        setExistingMember(!isAvailable ? { email } : null);
        setMemberEmailVerified(true);
      } else {
        // For parent: if email exists, treat as existing parent, otherwise new parent
        setExistingParent(
          !isAvailable
            ? {
                email,
                firstName: "Existing", // Placeholder - would come from API response
                lastName: "Parent",
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error checking email availability:", error);
      toast.error("Failed to check email availability. Please try again.");

      if (type === "member") {
        setExistingMember(null);
        setMemberEmailVerified(false);
      } else {
        setExistingParent(null);
      }
    } finally {
      if (type === "member") {
        setCheckingMember(false);
      } else {
        setCheckingParent(false);
      }
    }
  };

  const addChildForm = () => {
    setChildrenToRegister([
      ...childrenToRegister,
      { id: Date.now(), formData: null },
    ]);
  };

  const removeChildForm = (id: number) => {
    setChildrenToRegister(
      childrenToRegister.filter((child) => child.id !== id)
    );
  };

  return (
    <div className="space-y-6">
      {!showForm ? (
        <RegistrationTypeSelector
          registrationType={registrationType}
          setRegistrationType={setRegistrationType}
          memberEmail={memberEmail}
          setMemberEmail={setMemberEmail}
          parentEmail={parentEmail}
          setParentEmail={setParentEmail}
          existingMember={existingMember}
          existingParent={existingParent}
          checkingMember={checkingMember}
          checkingParent={checkingParent}
          memberEmailVerified={memberEmailVerified}
          checkEmailIsAvailable={checkEmailIsAvailable}
          onProceed={() => setShowForm(true)}
          setMemberEmailVerified={setMemberEmailVerified}
          setExistingMember={setExistingMember}
        />
      ) : (
        <div className="space-y-6 m-4">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="rounded-xl"
            >
              ← Back to Selection
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {registrationType === "member"
                  ? "Register Member (Player)"
                  : existingParent
                  ? `Add Children to ${existingParent.firstName} ${existingParent.lastName}`
                  : "Register Parent + Children"}
              </h2>
              <p className="text-gray-600">
                {registrationType === "member"
                  ? "Complete the member profile form. Login credentials will be sent to the member's email."
                  : "Complete the parent profile and add children. Only the parent receives login credentials."}
              </p>
            </div>
          </div>

          {registrationType === "member" ? (
            /* Single Member Registration */
            <RegistrationForm
              type="member"
              isDirect={true}
              preFilledEmail={memberEmail}
              onComplete={() => {
                // Handle completion
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            /* Parent + Multiple Children Registration */
            <div className="">
              {!existingParent && (
                /* Parent Profile Form */
                <RegistrationForm
                  type="parent"
                  isDirect={true}
                  preFilledEmail={parentEmail}
                  onComplete={() => {
                    // Handle parent profile completion
                    console.log("Parent profile completed");
                  }}
                  onCancel={() => setShowForm(false)}
                  showActionButtons={false} // We'll handle submit at the end
                />
              )}

              {/* Children Registration Section */}
              <Card className="border-0">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        Children Information
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Add one or more children to this parent account.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={addChildForm}
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Child
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {childrenToRegister.map((child, index) => (
                    <div key={child.id} className="relative">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-gray-900">
                          Child {index + 1}
                        </h3>
                        {childrenToRegister.length > 1 && (
                          <Button
                            onClick={() => removeChildForm(child.id)}
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="border border-gray-200 rounded-xl p-6">
                        <ChildRegistrationForm
                          parentEmail={existingParent?.email || parentEmail}
                          onComplete={(childData: any) => {
                            // Handle child completion
                            const updatedChildren = [...childrenToRegister];
                            updatedChildren[index].formData = childData;
                            setChildrenToRegister(updatedChildren);
                          }}
                          onCancel={() => setShowForm(false)}
                          showActionButtons={false} // We'll handle submit at the end
                        />
                      </div>
                    </div>
                  ))}

                  {/* Submit All Button */}
                  <div className="flex gap-4 pt-6 border-t border-gray-100">
                    <Button
                      onClick={() => {
                        // Handle submitting parent + all children
                        console.log("Submitting parent and children:", {
                          existingParent,
                          parentEmail,
                          children: childrenToRegister,
                        });
                        setShowForm(false);
                      }}
                      className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {existingParent
                        ? `Register ${childrenToRegister.length} Child${
                            childrenToRegister.length > 1 ? "ren" : ""
                          }`
                        : `Register Parent + ${
                            childrenToRegister.length
                          } Child${childrenToRegister.length > 1 ? "ren" : ""}`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="rounded-xl px-8 py-3 border-gray-200 hover:border-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
