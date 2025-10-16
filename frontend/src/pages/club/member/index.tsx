import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Users,
  UserPlus,
  Mail,
  ClipboardList,
  Users2,
  UserCheck,
  UserX,
  Phone,
  Calendar,
  MapPin,
  Filter,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  Download,
} from "lucide-react";
import { useAppStore } from "../../../store";
import { useNavigate } from "react-router-dom";
import {
  membersAPI,
  ClubMember,
  ChildInfo,
  ParentInfo,
} from "../../../api/members";

// Component to display parent-child relationships
function RelationshipInfo({ member }: { member: ClubMember }) {
  if (member.membershipType === "parent" && member.hasChildren) {
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
          <Users2 className="w-4 h-4" />
          <span className="font-semibold">
            Children ({member.children.length})
          </span>
        </div>
        <div className="space-y-2">
          {member.children.map((child: ChildInfo) => (
            <div
              key={child.id}
              className="bg-white rounded-md p-3 border border-blue-100"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {child.firstName} {child.lastName}
                </span>
                <div className="flex items-center gap-2">
                  {!child.isRegistered && (
                    <Badge
                      variant="secondary"
                      title="No Login Credential"
                      className="text-xs px-2 py-1 flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-200"
                    >
                      <UserX className="w-3 h-3" />
                      No Login
                    </Badge>
                  )}
                  {child.isRegistered && (
                    <Badge
                      variant="default"
                      className="text-xs px-2 py-1 flex items-center gap-1 bg-green-100 text-green-700 border-green-200"
                    >
                      <UserCheck className="w-3 h-3" />
                      Registered
                    </Badge>
                  )}
                </div>
              </div>
              {child.position && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{child.position}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (member.membershipType === "member" && member.hasParents) {
    return (
      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
        <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
          <UserCheck className="w-4 h-4" />
          <span className="font-semibold">
            Parents ({member.parents.length})
          </span>
        </div>
        <div className="space-y-2">
          {member.parents.map((parent: ParentInfo) => (
            <div
              key={parent.id}
              className="flex items-center justify-between bg-white rounded-md p-2 border border-green-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  {parent.name}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 bg-gray-50"
                >
                  {parent.relationship}
                </Badge>
              </div>
              {parent.phone && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Phone className="w-3 h-3" />
                  <span>{parent.phone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function ClubMemberPage() {
  const navigate = useNavigate();
  const { userClub } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(
    new Set()
  );

  // Load members for the current club
  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      try {
        // Use real API call to get club members
        const clubMembers = await membersAPI.getMyClubMembers();
        setMembers(clubMembers);
      } catch (error) {
        console.error("Failed to load members:", error);
        // Check if it's a "no club found" error
        if (
          error instanceof Error &&
          error.message &&
          error.message.includes("No club found")
        ) {
          navigate("/app/club/setup");
          return;
        }
        // Fallback to empty array if API fails
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Always try to load members, regardless of userClub state
    // The API will handle the case where no club exists
    loadMembers();
  }, [navigate]); // Include navigate dependency

  const filteredAndSortedMembers = members
    .filter((member) => {
      const matchesSearch =
        (member.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.position || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (member.status || "").toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = (a.name || "").toLowerCase();
          bValue = (b.name || "").toLowerCase();
          break;
        case "email":
          aValue = (a.email || "").toLowerCase();
          bValue = (b.email || "").toLowerCase();
          break;
        case "position":
          aValue = (a.position || "").toLowerCase();
          bValue = (b.position || "").toLowerCase();
          break;
        case "joinDate":
          aValue = new Date(a.joinDate).getTime();
          bValue = new Date(b.joinDate).getTime();
          break;
        case "status":
          aValue = (a.status || "").toLowerCase();
          bValue = (b.status || "").toLowerCase();
          break;
        default:
          aValue = (a.name || "").toLowerCase();
          bValue = (b.name || "").toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const handleEdit = (memberId: number) => {
    navigate(`/app/club/member/manage/${memberId}`);
  };

  const handleDelete = (memberId: number) => {
    console.log("Delete member:", memberId);
    // TODO: Implement delete functionality
  };

  const handleAddMember = () => {
    navigate("/app/club/member/manage");
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <SortAsc className="w-4 h-4 opacity-50" />;
    return sortOrder === "asc" ? (
      <SortAsc className="w-4 h-4" />
    ) : (
      <SortDesc className="w-4 h-4" />
    );
  };

  const handleSelectMember = (memberId: number) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === filteredAndSortedMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredAndSortedMembers.map((m) => m.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedMembers.size === 0) return;
    console.log("Bulk delete members:", Array.from(selectedMembers));
    // TODO: Implement bulk delete functionality
    setSelectedMembers(new Set());
  };

  const handleBulkExport = () => {
    if (selectedMembers.size === 0) return;
    const selectedMembersData = filteredAndSortedMembers.filter((m) =>
      selectedMembers.has(m.id)
    );
    console.log("Export members:", selectedMembersData);
    // TODO: Implement export functionality
  };

  // Calculate stats from real data
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === "Active").length,
    pendingInvitations: 0, // TODO: Get from invitation API
    newThisMonth: members.filter((m) => {
      const joinDate = new Date(m.joinDate);
      const now = new Date();
      return (
        joinDate.getMonth() === now.getMonth() &&
        joinDate.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Club Members</h1>
          <p className="text-gray-600">
            Manage members for {userClub?.name || "your club"}
          </p>
        </div>
        <Button
          onClick={handleAddMember}
          className="rounded-xl gradient-primary text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 rounded-xl">
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

      {/* Members List */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Member Directory
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage all registered members and parents (
                {filteredAndSortedMembers.length} total)
              </CardDescription>
            </div>

            {/* Bulk Actions */}
            {selectedMembers.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedMembers.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkExport}
                  className="rounded-lg border-gray-200 hover:border-green-300 hover:text-green-600"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="rounded-lg border-gray-200 hover:border-red-300 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedMembers(new Set())}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filters and Sorting */}
            <div className="space-y-4">
              {/* Search and Status Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search members by name, email, or position..."
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

              {/* Sorting Options */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600 font-medium">
                    Sort by:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "position", label: "Position" },
                    { key: "joinDate", label: "Join Date" },
                    { key: "status", label: "Status" },
                  ].map((option) => (
                    <Button
                      key={option.key}
                      variant={sortBy === option.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort(option.key)}
                      className="rounded-lg text-xs h-8 px-3 flex items-center gap-1 hover:shadow-sm transition-all"
                    >
                      <span className="hidden sm:inline">{option.label}</span>
                      <span className="sm:hidden">
                        {option.label.substring(0, 3)}
                      </span>
                      {getSortIcon(option.key)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-4">
              {/* Select All Header */}
              {filteredAndSortedMembers.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="p-1 h-auto hover:bg-white"
                  >
                    {selectedMembers.size ===
                    filteredAndSortedMembers.length ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedMembers.size === filteredAndSortedMembers.length
                      ? "Deselect all"
                      : "Select all members"}
                  </span>
                </div>
              )}

              {filteredAndSortedMembers.length === 0 ? (
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
                      : "Get started by adding members to your club"}
                  </p>
                  <Button
                    onClick={handleAddMember}
                    className="rounded-xl gradient-primary text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                filteredAndSortedMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-primary/20"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Selection Checkbox */}
                        <div className="flex items-start">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectMember(member.id)}
                            className="p-1 h-auto hover:bg-gray-100"
                          >
                            {selectedMembers.has(member.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </Button>
                        </div>

                        {/* Main Member Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-md ring-2 ring-white flex-shrink-0">
                            <AvatarImage
                              src={member.profileImage}
                              className="rounded-2xl object-cover"
                              alt={member.name}
                            />
                            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold text-sm sm:text-base">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            {/* Name and Type */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900 text-base sm:text-lg">
                                {member.name}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant={
                                    member.membershipType === "member"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="rounded-lg text-xs font-medium"
                                >
                                  {member.membershipType === "member"
                                    ? "Player"
                                    : "Parent"}
                                </Badge>
                                <Badge
                                  variant={
                                    member.status === "Active"
                                      ? "default"
                                      : member.status === "Pending"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="rounded-lg text-xs"
                                >
                                  {member.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-1 mb-3">
                              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span>
                                  Joined{" "}
                                  {new Date(
                                    member.joinDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {member.phone}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Position and Age */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                              {member.position && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-medium">
                                    {member.position}
                                  </span>
                                </div>
                              )}
                              {member.age && <span>Age: {member.age}</span>}
                            </div>

                            {/* Parent-child relationships */}
                            <RelationshipInfo member={member} />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 sm:ml-4 sm:flex-col">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-gray-200 hover:border-primary hover:text-primary hover:bg-primary/5 flex-1 sm:flex-none"
                            onClick={() => handleEdit(member.id)}
                            title="Edit member"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="ml-2 sm:hidden">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-gray-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                            onClick={() => handleDelete(member.id)}
                            title="Delete member"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="ml-2 sm:hidden">Delete</span>
                          </Button>
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
