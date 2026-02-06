import React, { useState, useEffect, useCallback } from "react";
import { toast } from "@/utils/toast";
import { useAuth } from "@/stores/authStore";
import {
  PersonnelTabs,
  PersonnelForm,
  PersonnelTable,
} from "../components";
import { Personnel, PersonnelFormData } from "../types/component-types";
import {
  fetchPersonnel,
  addPersonnel,
  updatePersonnel,
  deletePersonnel,
} from "../actions";
import { useNavigate } from "react-router-dom";

export function PersonnelManagementPage() {
  const navigate = useNavigate();
  const { userClub } = useAuth();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(
    null
  );
  const [formData, setFormData] = useState<PersonnelFormData>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    avatar: "",
    role: "staff", // Default to staff
    certificationLevel: "",
    yearsOfExperience: 0,
    bio: "",
    dateOfBirth: "",
    sendLoginEmail: true,
  });

  // Get club ID from user club context
  const clubId = userClub?.id;

  const loadPersonnel = useCallback(async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const personnelData = await fetchPersonnel(clubId);
      setPersonnel(personnelData);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      toast.error("Failed to fetch personnel", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId) {
      loadPersonnel();
    }else{
    toast.error("No club found", {
      description: "Please set up your club before managing personnel",
    });
    navigate("/app/club/setup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, loadPersonnel]);

  const handleAddPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    try {
      await addPersonnel(clubId, formData);
      toast.success("Staff added successfully", {
        description: "The new staff member has been added to your club",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadPersonnel();
    } catch (error) {
      console.error("Error adding personnel:", error);
      toast.error("Failed to add personnel", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  const handleUpdatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersonnel) return;

    try {
      await updatePersonnel(editingPersonnel.userRoleId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        avatar: formData.avatar,
      });

      toast.success("Staff updated successfully", {
        description: "The staff information has been updated",
      });
      setIsEditDialogOpen(false);
      setEditingPersonnel(null);
      resetForm();
      loadPersonnel();
    } catch (error) {
      console.error("Error updating personnel:", error);
      toast.error("Failed to update personnel", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  const handleDeletePersonnel = async (userRoleId: number) => {
    if (
      !confirm("Are you sure you want to remove this personnel from the club?")
    ) {
      return;
    }

    try {
      await deletePersonnel(userRoleId);
      toast.success("Personnel removed successfully", {
        description: "The personnel has been removed from your club",
      });
      loadPersonnel();
    } catch (error) {
      console.error("Error removing personnel:", error);
      toast.error("Failed to remove personnel", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  const openEditDialog = (person: Personnel) => {
    setEditingPersonnel(person);
    setFormData({
      email: person.email,
      firstName: person.firstName,
      lastName: person.lastName,
      phone: person.phone || "",
      avatar: person.avatar || "",
      role: (person.role as PersonnelFormData["role"]) || "staff",
      certificationLevel: person.certificationLevel || "",
      yearsOfExperience: person.yearsOfExperience || 0,
      bio: person.bio || "",
      dateOfBirth: person.dateOfBirth || "",
      sendLoginEmail: true,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      avatar: "",
      role: "staff",
      certificationLevel: "",
      yearsOfExperience: 0,
      bio: "",
      dateOfBirth: "",
      sendLoginEmail: true,
    });
  };

  return (
    <>
      <PersonnelTabs />

      <PersonnelTable
        personnel={personnel}
        loading={loading}
        onEdit={openEditDialog}
        onDelete={handleDeletePersonnel}
        onAddNew={() => setIsAddDialogOpen(true)}
      />

      {/* Add New Staff Dialog */}
      <PersonnelForm
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleAddPersonnel}
        isEdit={false}
      />

      {/* Edit Staff Dialog */}
      <PersonnelForm
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleUpdatePersonnel}
        isEdit={true}
      />
    </>
  );
}
