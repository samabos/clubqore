import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateTeamRequest, UpdateTeamRequest, Team } from "../types";
import { useAuth } from "@/stores/authStore";
import { usePersonnel } from "@/stores/personnelStore";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

interface TeamFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTeamRequest | UpdateTeamRequest) => Promise<void>;
  isEdit?: boolean;
  initialData?: Partial<CreateTeamRequest> | Team;
  isLoading?: boolean;
}

export function TeamForm({
  isOpen,
  onOpenChange,
  onSubmit,
  isEdit = false,
  initialData,
  isLoading = false,
}: TeamFormProps) {
  const { userClub } = useAuth();
  const { availablePersonnel, loadPersonnel } = usePersonnel();
  const [formData, setFormData] = useState<
    CreateTeamRequest | UpdateTeamRequest
  >({
    name: initialData?.name || "",
    color: initialData?.color || "#3B82F6",
    is_active:
      initialData?.is_active !== undefined ? initialData.is_active : true,
    ...("manager_id" in (initialData || {})
      ? { manager_id: (initialData as Team).manager_id ?? null }
      : { manager_id: null }),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        color: initialData.color || "#3B82F6",
        is_active:
          initialData.is_active !== undefined ? initialData.is_active : true,
        ...("manager_id" in initialData
          ? { manager_id: (initialData as Team).manager_id ?? null }
          : { manager_id: null }),
      });
    } else {
      setFormData({
        name: "",
        color: "#3B82F6",
        is_active: true,
        manager_id: null,
      });
    }
    setErrors({});
  }, [initialData, isEdit]);

  // Load available personnel when dialog opens
  useEffect(() => {
    if (isOpen && userClub) {
      loadPersonnel(userClub.id);
    }
  }, [isOpen, userClub, loadPersonnel]);

  const handleManagerChange = (managerId: string) => {
    const managerIdNum = managerId === "none" ? null : parseInt(managerId);
    setFormData((prev) => ({ ...prev, manager_id: managerIdNum }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Team name is required";
    }
    if (formData.name.length > 255) {
      newErrors.name = "Team name must be less than 255 characters";
    }
    if (formData.color && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = "Color must be a valid hex code (e.g., #FF5733)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        name: "",
        color: "#3B82F6",
        is_active: true,
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting team form:", error);
      toast.error("Failed to save team. Please try again.");
    }
  };

  const handleInputChange = (
    field: keyof CreateTeamRequest,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Team" : "Create New Team"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the team details below."
              : "Create a new team for your club and optionally assign a manager now."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter team name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Team Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                placeholder="#3B82F6"
                className={`flex-1 ${errors.color ? "border-red-500" : ""}`}
              />
            </div>
            {errors.color && (
              <p className="text-sm text-red-500">{errors.color}</p>
            )}
            <p className="text-xs text-gray-500">
              Choose a color to identify this team
            </p>
          </div>

          <div className="space-y-2">
              <Label htmlFor="manager">Team Manager</Label>
              <Select
                value={
                  ("manager_id" in formData
                    ? formData.manager_id?.toString()
                    : "none") || "none"
                }
                onValueChange={handleManagerChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      <span>No manager assigned</span>
                    </div>
                  </SelectItem>
                  {availablePersonnel.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        <span>{person.fullName}</span>
                        <span className="text-xs text-gray-500">
                          ({person.role})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Assign a team manager to oversee this team
              </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                handleInputChange("is_active", checked)
              }
            />
            <Label htmlFor="is_active">Active Team</Label>
          </div>
          <p className="text-xs text-gray-500">
            Inactive teams won't appear in member assignment lists
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEdit ? "Update Team" : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
