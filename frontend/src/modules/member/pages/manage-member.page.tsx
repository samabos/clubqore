import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreateMemberRequest, ClubMember } from "../types/component-types";
import { toast } from "sonner";
import {
  ManageMemberHeader,
  ManageMemberForm,
  ManageMemberLoading,
} from "../components";
import { ChildData } from "../types/component-types";
import {
  getMemberById,
  createMember,
  updateMember,
  endMemberContract,
  checkMemberEmailAvailable,
} from "../actions";

export function ManageMemberPage() {
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingMember, setExistingMember] = useState<ClubMember | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  // Track email check state if needed for UI later

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

  const populateFormWithExistingData = useCallback(
    (member: ClubMember) => {
      console.log("🔍 Member data received:", member);

      if (!member) {
        console.error("❌ Member data is null/undefined");
        toast.error("Member data not found");
        return;
      }

      console.log("🔍 Full member data:", JSON.stringify(member, null, 2));
      console.log("🔍 Children data:", member.children);
      console.log("🔍 Membership type:", member.membershipType);
      console.log("🔍 Member name:", member.name);

      // Check if this is a child member (not a parent)
      if (member.membershipType === "member") {
        console.log(
          "⚠️ This is a child member, not a parent. Cannot edit child members directly."
        );
        toast.error("Cannot edit child members directly", {
          description:
            "Child members are managed through their parent's account. Please edit the parent account instead.",
        });
        // Navigate back to member list
        navigate("/app/club/members");
        return;
      }

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
      const childrenData: ChildData[] = (member.children || []).map(
        (child, index) => {
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
            childUserId: child.id, // Preserve the actual child_user_id for updates
            firstName: child.firstName,
            lastName: child.lastName,
            dateOfBirth: formattedDateOfBirth,
            position: child.position || "",
            medicalInfo: "",
          };
        }
      );

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
    },
    [navigate]
  );

  const loadExistingMember = useCallback(
    async (id: number) => {
      try {
        console.log("🔍 Loading member with ID:", id);
        setIsLoading(true);
        const member = await getMemberById(id);
        console.log("🔍 Member loaded successfully:", member);
        setExistingMember(member);
        populateFormWithExistingData(member);
      } catch (error) {
        console.error("Failed to load member:", error);
        toast.error("Failed to load member data");
      } finally {
        setIsLoading(false);
      }
    },
    [populateFormWithExistingData]
  );

  // Load existing member data if in edit mode
  useEffect(() => {
    console.log("🔍 useEffect - memberId from URL:", memberId);
    if (memberId) {
      setIsEditMode(true);
      const parsedId = parseInt(memberId);
      console.log("🔍 Parsed member ID:", parsedId);
      loadExistingMember(parsedId);
    }
  }, [memberId, loadExistingMember]);

  // Debounced email availability check when typing (create mode only)
  useEffect(() => {
    if (isEditMode) return; // don't check when editing
    const email = formData.email?.trim();
    if (!email) {
      setEmailAvailable(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const available = await checkMemberEmailAvailable(email);
        setEmailAvailable(available);
        if (!available) {
          toast.warning("Email already exists", {
            description:
              "This email is already registered. Use a different email.",
          });
        }
      } catch {
        // ignore transient errors
      }
    }, 400);
    return () => {
      clearTimeout(t);
    };
  }, [formData.email, isEditMode]);

  // Show loading state while loading existing member data
  if (isLoading && isEditMode) {
    return <ManageMemberLoading />;
  }

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

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setIsLoading(true);

    try {
      // Prevent submit if email known to be unavailable
      if (!isEditMode && emailAvailable === false) {
        toast.error("Email already exists", {
          description: "Please use a different email.",
        });
        return;
      }
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

        await updateMember(existingMember.id, updateData);

        const childrenCount = memberData.children?.length || 0;
        toast.success("Member updated successfully!", {
          description: `Updated information for ${formData.firstName} ${
            formData.lastName
          }${
            childrenCount > 0
              ? ` with ${childrenCount} player${childrenCount > 1 ? "s" : ""}`
              : ""
          }.`,
        });
      } else {
        const response = await createMember(memberData);

        const childrenCount = memberData.children?.length || 0;
        toast.success("Parent and players registered successfully!", {
          description: `Account created for ${formData.firstName} ${
            formData.lastName
          }${
            childrenCount > 0
              ? ` with ${childrenCount} player${childrenCount > 1 ? "s" : ""}`
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
      } else if (
        error instanceof Error &&
        error.message.includes("Email already exists")
      ) {
        toast.error("Email already exists", {
          description:
            "This email is already registered. Use a different email.",
        });
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

  const handleEndContract = async () => {
    if (!existingMember) return;

    const childrenCount = children.length;
    const confirmMessage = `Are you sure you want to end the contract for ${
      formData.firstName
    } ${
      formData.lastName
    }?\n\nThis will:\n• Deactivate the parent account\n• Remove ${childrenCount} player${
      childrenCount > 1 ? "s" : ""
    } from all teams\n• Hide them from active member lists\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split("T")[0];
      await endMemberContract(existingMember.accountId, today);

      toast.success("Contract ended successfully", {
        description: `The contract for ${formData.firstName} ${
          formData.lastName
        } and their ${childrenCount} player${
          childrenCount > 1 ? "s" : ""
        } has been ended.`,
      });

      // Navigate back to member list
      navigate("/app/club/members");
    } catch (error) {
      console.error("Failed to end contract:", error);
      toast.error("Failed to end contract", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ManageMemberHeader
        isEditMode={isEditMode}
        onBack={() => navigate("/app/club/members")}
      />

      <ManageMemberForm
        formData={formData}
        children={children}
        isLoading={isLoading}
        isEditMode={isEditMode}
        onFormDataChange={updateField}
        onChildFieldChange={updateChildField}
        onAddChild={addChild}
        onRemoveChild={removeChild}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/app/club/members")}
        onEndContract={isEditMode ? handleEndContract : undefined}
      />
    </div>
  );
}
