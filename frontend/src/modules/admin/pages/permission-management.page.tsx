import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Save, RotateCcw } from "lucide-react";
import {
  fetchPermissionMatrix,
  bulkUpdateRolePermissions,
} from "../actions/permission-actions";
import type { PermissionMatrix, Role, PermissionMatrixEntry, BulkUpdatePermissionData } from "@/types/permission";

type PermissionAction = "can_view" | "can_create" | "can_edit" | "can_delete";

export function PermissionManagementPage() {
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // Local permission state for the selected role
  const [localPermissions, setLocalPermissions] = useState<Map<number, PermissionMatrixEntry>>(new Map());
  const [originalPermissions, setOriginalPermissions] = useState<Map<number, PermissionMatrixEntry>>(new Map());

  useEffect(() => {
    loadMatrix();
  }, []);

  useEffect(() => {
    if (selectedRoleId && matrix) {
      const roleData = matrix.matrix.find((r) => r.role.id.toString() === selectedRoleId);
      if (roleData) {
        const permsMap = new Map<number, PermissionMatrixEntry>();
        roleData.permissions.forEach((p) => {
          permsMap.set(p.resource_id, { ...p });
        });
        setLocalPermissions(permsMap);
        setOriginalPermissions(new Map(permsMap));
        setHasChanges(false);
      }
    }
  }, [selectedRoleId, matrix]);

  const loadMatrix = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPermissionMatrix();
      setMatrix(data);
      // Auto-select first role if available
      if (data.roles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data.roles[0].id.toString());
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load permissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = useMemo(() => {
    if (!matrix || !selectedRoleId) return null;
    return matrix.roles.find((r) => r.id.toString() === selectedRoleId);
  }, [matrix, selectedRoleId]);

  // Group resources by type for better display
  const groupedResources = useMemo(() => {
    if (!matrix) return new Map();
    const groups = new Map<string, typeof matrix.resources>();

    matrix.resources.forEach((resource) => {
      const type = resource.type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(resource);
    });

    return groups;
  }, [matrix]);

  const handlePermissionChange = (
    resourceId: number,
    action: PermissionAction,
    checked: boolean
  ) => {
    setLocalPermissions((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(resourceId);
      if (current) {
        newMap.set(resourceId, { ...current, [action]: checked });
      }
      return newMap;
    });
    setHasChanges(true);
  };

  const handleBulkAction = (action: PermissionAction, checked: boolean) => {
    setLocalPermissions((prev) => {
      const newMap = new Map(prev);
      newMap.forEach((perm, resourceId) => {
        newMap.set(resourceId, { ...perm, [action]: checked });
      });
      return newMap;
    });
    setHasChanges(true);
  };

  const handleReset = () => {
    setLocalPermissions(new Map(originalPermissions));
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;

    setIsSaving(true);
    try {
      const permissions: BulkUpdatePermissionData[] = [];
      localPermissions.forEach((perm, resourceId) => {
        permissions.push({
          resource_id: resourceId,
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete,
          is_active: true,
        });
      });

      await bulkUpdateRolePermissions(parseInt(selectedRoleId), permissions);

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });

      // Reload to get fresh data
      await loadMatrix();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save permissions",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPermission = (resourceId: number): PermissionMatrixEntry | undefined => {
    return localPermissions.get(resourceId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure which resources each role can access
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
          <CardDescription>
            Choose a role to view and edit its permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent>
              {matrix?.roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.display_name || role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Permissions for {selectedRole.display_name || selectedRole.name}
                </CardTitle>
                <CardDescription>
                  Check the boxes to grant permissions for each resource
                </CardDescription>
              </div>
              {hasChanges && (
                <Badge variant="secondary">Unsaved changes</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions */}
            <div className="flex gap-4 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Bulk Actions:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction("can_view", true)}
              >
                Select All View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction("can_view", false)}
              >
                Clear All View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleBulkAction("can_view", false);
                  handleBulkAction("can_create", false);
                  handleBulkAction("can_edit", false);
                  handleBulkAction("can_delete", false);
                }}
              >
                Clear All
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Resource</TableHead>
                  <TableHead className="text-center w-[100px]">View</TableHead>
                  <TableHead className="text-center w-[100px]">Create</TableHead>
                  <TableHead className="text-center w-[100px]">Edit</TableHead>
                  <TableHead className="text-center w-[100px]">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(groupedResources.entries()).map(([type, resources]) => (
                  <>
                    {/* Type Header Row */}
                    <TableRow key={`type-${type}`} className="bg-muted/50">
                      <TableCell colSpan={5} className="font-semibold capitalize">
                        {type}s
                      </TableCell>
                    </TableRow>
                    {/* Resource Rows */}
                    {resources.map((resource) => {
                      const perm = getPermission(resource.id);
                      return (
                        <TableRow key={resource.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{resource.display_name}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {resource.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.can_view || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(resource.id, "can_view", checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.can_create || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(resource.id, "can_create", checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.can_edit || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(resource.id, "can_edit", checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.can_delete || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(resource.id, "can_delete", checked as boolean)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!selectedRoleId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please select a role to view and edit its permissions
          </CardContent>
        </Card>
      )}
    </div>
  );
}
