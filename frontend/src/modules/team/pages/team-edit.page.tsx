import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/stores/authStore";
import { usePersonnel } from "@/stores/personnelStore";
import { Team, UpdateTeamRequest } from "../types";
import { fetchTeamById, updateTeam } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, X, UserCog } from "lucide-react";
import { TeamLoading } from "@/components/ui/loading";

export function TeamEditPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { userClub } = useAuth();
  const { availablePersonnel, loadPersonnel } = usePersonnel();
  const [team, setTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<UpdateTeamRequest>({
    name: "",
    color: "#3B82F6",
    is_active: true,
    manager_id: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!teamId) return;

    try {
      setIsLoading(true);
      const teamData = await fetchTeamById(parseInt(teamId));

      setTeam(teamData);
      setFormData({
        name: teamData.name,
        color: teamData.color || "#3B82F6",
        is_active: teamData.is_active,
        manager_id: teamData.manager_id || null,
      });
    } catch (error) {
      console.error("Error loading team:", error);
      toast.error("Failed to load team details");
      navigate("/app/teams");
    } finally {
      setIsLoading(false);
    }
  }, [teamId, navigate]);

  useEffect(() => {
    if (teamId) {
      loadTeam();
    }
  }, [teamId, loadTeam]);

  // Load personnel when component mounts and userClub is available
  useEffect(() => {
    if (userClub) {
      loadPersonnel(userClub.id);
    }
  }, [userClub, loadPersonnel]);

  const handleInputChange = (
    field: keyof UpdateTeamRequest,
    value: string | boolean | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleManagerChange = (managerId: string) => {
    const managerIdNum = managerId === "none" ? null : parseInt(managerId);
    handleInputChange("manager_id", managerIdNum);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Team name is required";
    }
    if (formData.name && formData.name.length > 255) {
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
      setIsSaving(true);
      await updateTeam(parseInt(teamId), formData);
      toast.success("Team updated successfully!");
      // Reload team data to show updated manager
      await loadTeam();
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <TeamLoading message="Loading team details..." />;
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Team Not Found
        </h2>
        <p className="text-gray-600">
          The team you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button onClick={() => navigate("/app/teams")} className="mt-4">
          Back to Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/app/teams/${teamId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Team</h1>
            <p className="text-gray-600">Update team details and settings</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
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
                  value={formData.color || "#3B82F6"}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.color || "#3B82F6"}
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
                value={formData.manager_id?.toString() || "none"}
                onValueChange={handleManagerChange}
                disabled={isSaving}
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
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) =>
                  handleInputChange("is_active", checked)
                }
              />
              <Label htmlFor="is_active">Active Team</Label>
            </div>
            <p className="text-xs text-gray-500">
              Inactive teams won't appear in member assignment lists
            </p>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/app/teams/${teamId}`)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
