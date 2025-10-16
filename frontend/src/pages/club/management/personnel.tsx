import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Mail, Phone, User } from "lucide-react";
import { toast } from "@/utils/toast";
import { useAppStore } from "@/store";

interface Personnel {
  userRoleId: number;
  userId: number;
  role: string;
  clubId: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  avatar: string;
  isOnboarded: boolean;
  roleCreatedAt: string;
}

interface PersonnelFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
}

const PersonnelManagement: React.FC = () => {
  const { userClub } = useAppStore();
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
  });

  // Get club ID from user club context
  const clubId = userClub?.id;

  useEffect(() => {
    if (clubId) {
      fetchPersonnel();
    }
  }, [clubId]);

  const fetchPersonnel = async () => {
    if (!clubId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/clubs/${clubId}/personnel`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch personnel");
      }

      const data = await response.json();
      setPersonnel(data.data || []);
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
  };

  const handleAddPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;

    try {
      const response = await fetch(`/api/clubs/${clubId}/personnel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add personnel");
      }

      toast.success("Personnel added successfully", {
        description: "The new personnel has been added to your club",
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchPersonnel();
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
      const response = await fetch(
        `/api/clubs/personnel/${editingPersonnel.userRoleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            avatar: formData.avatar,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update personnel");
      }

      toast.success("Personnel updated successfully", {
        description: "The personnel information has been updated",
      });
      setIsEditDialogOpen(false);
      setEditingPersonnel(null);
      resetForm();
      fetchPersonnel();
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
      const response = await fetch(`/api/clubs/personnel/${userRoleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove personnel");
      }

      toast.success("Personnel removed successfully", {
        description: "The personnel has been removed from your club",
      });
      fetchPersonnel();
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
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!clubId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading club information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Club Personnel
          </h1>
          <p className="text-gray-600">
            Manage your club coaches and staff members
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Personnel Management
            </h2>
            <p className="text-sm text-gray-600">
              Add, edit, and manage your club's coaching staff
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Personnel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Personnel</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPersonnel} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-gray-700"
                    >
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="avatar"
                    className="text-sm font-medium text-gray-700"
                  >
                    Avatar URL
                  </Label>
                  <Input
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl">
                    Add Personnel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Personnel List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : personnel.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No personnel found
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first coach or staff member to get started
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Personnel
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Added</TableHead>
                    <TableHead className="text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((person) => (
                    <TableRow key={person.userRoleId}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {person.avatar ? (
                            <img
                              src={person.avatar}
                              alt={person.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{person.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {person.role}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{person.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {person.phone ? (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{person.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={person.isOnboarded ? "default" : "secondary"}
                        >
                          {person.isOnboarded ? "Active" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(person.roleCreatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(person)}
                            className="rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDeletePersonnel(person.userRoleId)
                            }
                            className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Personnel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdatePersonnel} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50 rounded-xl border-gray-200"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-firstName"
                    className="text-sm font-medium text-gray-700"
                  >
                    First Name
                  </Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-lastName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-avatar"
                  className="text-sm font-medium text-gray-700"
                >
                  Avatar URL
                </Label>
                <Input
                  id="edit-avatar"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">
                  Update Personnel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default PersonnelManagement;
