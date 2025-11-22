import { apiClient } from "@/api/base";
import { Personnel, PersonnelFormData } from "../types/component-types";

// Fetch all personnel for a club
export const fetchPersonnel = async (clubId: number): Promise<Personnel[]> => {
  const response = await apiClient(`/clubs/${clubId}/personnel`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch personnel");
  }

  const data = await response.json();
  return data.data || [];
};

// Add new personnel to a club
export const addPersonnel = async (clubId: number, formData: PersonnelFormData): Promise<void> => {
  const response = await apiClient(`/clubs/${clubId}/personnel`, {
    method: "POST",
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to add personnel");
  }
};

// Update existing personnel
export const updatePersonnel = async (
  userRoleId: number,
  updateData: Partial<PersonnelFormData>
): Promise<void> => {
  const response = await apiClient(`/clubs/personnel/${userRoleId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update personnel");
  }
};

// Delete personnel from club
export const deletePersonnel = async (userRoleId: number): Promise<void> => {
  const response = await apiClient(`/clubs/personnel/${userRoleId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to remove personnel");
  }
};
