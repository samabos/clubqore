import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Download,
  Users,
  UserPlus,
  Mail,
  ClipboardList,
} from "lucide-react";

export function MemberDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data - replace with real data from API
  const existingMembers = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1234567890",
      club: "Manchester United Youth",
      position: "Forward",
      age: 16,
      status: "Active",
      joinDate: "2024-01-15",
      membershipType: "member",
      profileImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 2,
      name: "Emma Johnson",
      email: "emma.johnson@email.com",
      phone: "+1234567891",
      club: "Chelsea FC Academy",
      position: "Midfielder",
      age: 15,
      status: "Active",
      joinDate: "2024-02-20",
      membershipType: "member",
      profileImage:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@email.com",
      phone: "+1234567892",
      club: "Liverpool FC Youth",
      position: "Goalkeeper",
      age: 17,
      status: "Inactive",
      joinDate: "2023-09-10",
      membershipType: "member",
      profileImage:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      phone: "+1234567893",
      club: "Arsenal Academy",
      position: "Defender",
      age: 16,
      status: "Active",
      joinDate: "2024-01-20",
      membershipType: "member",
      profileImage:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 5,
      name: "David Wilson",
      email: "david.wilson@email.com",
      phone: "+1234567894",
      club: "Arsenal Academy",
      position: "Parent",
      age: 45,
      status: "Active",
      joinDate: "2024-01-20",
      membershipType: "parent",
      profileImage:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    },
  ];

  const filteredMembers = existingMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      member.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (memberId: number) => {
    console.log("Edit member:", memberId);
    // TODO: Implement edit functionality
  };

  const handleDelete = (memberId: number) => {
    console.log("Delete member:", memberId);
    // TODO: Implement delete functionality
  };

  const handleExport = () => {
    console.log("Export members");
    // TODO: Implement export functionality
  };

  // Calculate stats based on filtered members
  const stats = {
    totalMembers: existingMembers.length,
    activeMembers: existingMembers.filter((m) => m.status === "Active").length,
    pendingInvitations: 8, // This should come from actual invitation data
    newThisMonth: existingMembers.filter((m) => {
      const joinDate = new Date(m.joinDate);
      const now = new Date();
      return (
        joinDate.getMonth() === now.getMonth() &&
        joinDate.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 m-4">
        <Card className="border-0  rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalMembers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeMembers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Invites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingInvitations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.newThisMonth}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Member Directory
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage all registered members and parents (
                {filteredMembers.length} total)
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                className="rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search members by name, email, or club..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px] rounded-xl border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Members List */}
            <div className="space-y-4">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No members found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search criteria"
                      : "Get started by inviting members or registering them directly"}
                  </p>
                  <Button className="rounded-xl gradient-primary text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="border border-gray-100 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-16 h-16 rounded-2xl shadow-md">
                            <AvatarImage
                              src={member.profileImage}
                              className="rounded-2xl object-cover"
                              alt={member.name}
                            />
                            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {member.name}
                              </h4>
                              <Badge
                                variant={
                                  member.membershipType === "member"
                                    ? "default"
                                    : "secondary"
                                }
                                className="rounded-lg text-xs"
                              >
                                {member.membershipType === "member"
                                  ? "Player"
                                  : "Parent"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {member.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.phone}
                            </p>
                          </div>
                        </div>

                        <div className="text-center hidden md:block">
                          <p className="font-medium text-gray-900">
                            {member.club}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.position}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined{" "}
                            {new Date(member.joinDate).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-center hidden lg:block">
                          {member.membershipType === "member" && (
                            <p className="font-medium text-gray-900">
                              Age: {member.age}
                            </p>
                          )}
                          <Badge
                            variant={
                              member.status === "Active"
                                ? "default"
                                : member.status === "Pending"
                                ? "secondary"
                                : "outline"
                            }
                            className="rounded-lg"
                          >
                            {member.status}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-gray-200 hover:border-primary hover:text-primary"
                            onClick={() => handleEdit(member.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-gray-200 hover:border-red-300 hover:text-red-600"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Mobile-specific info */}
                      <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.club}
                            </p>
                            <p className="text-xs text-gray-600">
                              {member.position}
                            </p>
                          </div>
                          <div className="text-right">
                            {member.membershipType === "member" && (
                              <p className="text-sm text-gray-900">
                                Age: {member.age}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Joined{" "}
                              {new Date(member.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
