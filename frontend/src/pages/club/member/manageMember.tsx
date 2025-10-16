import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, Save } from "lucide-react";
import { membersAPI, CreateMemberRequest, ClubMember } from "@/api/members";
import { toast } from "sonner";
import ParentInformationForm from "@/components/member/ParentInformationForm";
import AccountSettingsForm from "@/components/member/AccountSettingsForm";
import ChildrenInformationForm, {
  ChildData,
} from "@/components/member/ChildrenInformationForm";

export default function ManageMemberPage() {
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingMember, setExistingMember] = useState<ClubMember | null>(null);

  const [formData, setFormData] = useState<CreateMemberRequest>({
    email: "",
    password: "",
    role: "parent", // Default to parent since only parents get login credentials
    firstName: "",
    lastName: "",
    phone: "",
    // dateOfBirth: "", // Not needed for parent registration
    position: "",
    parentPhone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    profileImage: "",
    generatePassword: true,
    sendWelcomeEmail: true,
  });

  // Children data for parent registration
  const [children, setChildren] = useState<ChildData[]>([
    {
      id: 1,
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      position: "",
      medicalInfo: "",
    },
  ]);

  const loadExistingMember = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      const member = await membersAPI.getMemberById(id);
      setExistingMember(member);
      populateFormWithExistingData(member);
    } catch (error) {
      console.error("Failed to load member:", error);
      toast.error("Failed to load member data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load existing member data if in edit mode
  useEffect(() => {
    if (memberId) {
      setIsEditMode(true);
      loadExistingMember(parseInt(memberId));
    }
  }, [memberId, loadExistingMember]);

  const populateFormWithExistingData = (member: ClubMember) => {
    console.log("🔍 Member data received:", member);
    console.log("🔍 Children data:", member.children);

    setFormData({
      email: member.email,
      password: "", // Don't populate password
      role: member.membershipType === "parent" ? "parent" : "member",
      firstName: member.name.split(" ")[0] || "",
      lastName: member.name.split(" ").slice(1).join(" ") || "",
      phone: member.phone,
      position: member.position,
      generatePassword: false,
      sendWelcomeEmail: false,
    });

    // Convert children data
    const childrenData: ChildData[] = member.children.map((child, index) => {
      console.log(`🔍 Child ${index + 1} data:`, child);
      console.log(
        `🔍 Child ${index + 1} dateOfBirth:`,
        child.dateOfBirth,
        typeof child.dateOfBirth
      );

      // Format date for HTML date input (YYYY-MM-DD)
      let formattedDateOfBirth = "";
      if (child.dateOfBirth) {
        const date = new Date(child.dateOfBirth);
        if (!isNaN(date.getTime())) {
          formattedDateOfBirth = date.toISOString().split("T")[0];
        }
      }

      console.log(
        `🔍 Child ${index + 1} formatted dateOfBirth:`,
        formattedDateOfBirth
      );

      return {
        id: index + 1,
        firstName: child.firstName,
        lastName: child.lastName,
        dateOfBirth: formattedDateOfBirth,
        position: "", // This might need to be added to the API
        medicalInfo: "", // This might need to be added to the API
      };
    });

    setChildren(
      childrenData.length > 0
        ? childrenData
        : [
            {
              id: 1,
              firstName: "",
              lastName: "",
              dateOfBirth: "",
              position: "",
              medicalInfo: "",
            },
          ]
    );
  };

  const updateField = (field: string, value: string | boolean) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, string>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const updateChildField = (childId: number, field: string, value: string) => {
    setChildren((prev) =>
      prev.map((child) =>
        child.id === childId ? { ...child, [field]: value } : child
      )
    );
  };

  const addChild = () => {
    setChildren((prev) => [
      ...prev,
      {
        id: Date.now(),
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        position: "",
        medicalInfo: "",
      },
    ]);
  };

  const removeChild = (childId: number) => {
    if (children.length > 1) {
      setChildren((prev) => prev.filter((child) => child.id !== childId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare the data with children information
      const memberData = {
        ...formData,
        // Remove password if generatePassword is true, let backend handle it
        password: formData.generatePassword ? undefined : formData.password,
        children: children.filter(
          (child) =>
            child.firstName.trim() && child.lastName.trim() && child.dateOfBirth
        ), // Only include children with required fields filled
      };

      if (isEditMode && existingMember) {
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          position: formData.position,
          children: memberData.children,
        };

        await membersAPI.updateMyClubMember(existingMember.id, updateData);

        const childrenCount = memberData.children?.length || 0;
        toast.success("Member updated successfully!", {
          description: `Updated information for ${formData.firstName} ${
            formData.lastName
          }${
            childrenCount > 0
              ? ` with ${childrenCount} child${childrenCount > 1 ? "ren" : ""}`
              : ""
          }.`,
        });
      } else {
        const response = await membersAPI.createMyClubMember(memberData);

        const childrenCount = memberData.children?.length || 0;
        toast.success("Parent and children registered successfully!", {
          description: `Account created for ${formData.firstName} ${
            formData.lastName
          }${
            childrenCount > 0
              ? ` with ${childrenCount} child${childrenCount > 1 ? "ren" : ""}`
              : ""
          }. Account number: ${response.member.accountNumber}`,
        });

        if (response.member.generatedPassword) {
          toast.info("Generated Password", {
            description: `Password: ${response.member.generatedPassword}. Please share this with the parent.`,
            duration: 10000,
          });
        }
      }

      // Navigate back to member list
      navigate("/app/club/members");
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} member:`,
        error
      );

      // Check if it's a "no club found" error
      if (error instanceof Error && error.message.includes("No club found")) {
        toast.error("Club Setup Required", {
          description:
            "You need to set up your club first before adding members. Redirecting to club setup...",
          duration: 5000,
        });

        // Redirect to club setup page after a short delay
        setTimeout(() => {
          navigate("/app/club/setup");
        }, 2000);
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        toast.error(`Failed to ${isEditMode ? "update" : "create"} member`, {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/app/club/members")}
          className="rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Members
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {isEditMode ? (
              <Save className="w-6 h-6" />
            ) : (
              <UserPlus className="w-6 h-6" />
            )}
            {isEditMode
              ? "Edit Member & Children"
              : "Register Parent & Children"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? "Update member information and children details"
              : "Register a parent account with login credentials and add their children as club members"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parent Information */}
        <ParentInformationForm
          formData={{
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || "",
          }}
          updateField={updateField}
          isEditMode={isEditMode}
        />

        {/* Account Settings */}
        <AccountSettingsForm
          formData={{
            password: formData.password || "",
            generatePassword: formData.generatePassword || false,
            sendWelcomeEmail: formData.sendWelcomeEmail || false,
          }}
          updateField={updateField}
          isEditMode={isEditMode}
        />

        {/* Children Information */}
        <ChildrenInformationForm
          children={children}
          updateChildField={updateChildField}
          addChild={addChild}
          removeChild={removeChild}
          isEditMode={isEditMode}
        />

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
                "Creating Parent & Children..."
              )
            ) : (
              <>
                {isEditMode ? (
                  <Save className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isEditMode
                  ? `Update Member & ${children.length} Child${
                      children.length > 1 ? "ren" : ""
                    }`
                  : `Create Parent & ${children.length} Child${
                      children.length > 1 ? "ren" : ""
                    }`}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/app/club/members")}
            className="rounded-xl px-8 py-3 border-gray-200 hover:border-gray-300"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
