import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import {
  Search,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Eye,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function InvitationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock invitations data - no type field since recipients choose role during registration
  const invitations = [
    {
      id: "inv-001",
      email: "alex.smith@email.com",
      firstName: "Alex",
      lastName: "Smith",
      clubName: "Manchester United Youth",
      invitedBy: "John Manager",
      invitedAt: new Date("2024-07-25T10:30:00"),
      expiresAt: new Date("2024-08-01T10:30:00"),
      status: "pending",
      lastReminder: new Date("2024-07-27T09:00:00"),
    },
    {
      id: "inv-002",
      email: "maria.garcia@email.com",
      firstName: "Maria",
      lastName: "Garcia",
      clubName: "Chelsea FC Academy",
      invitedBy: "Sarah Coach",
      invitedAt: new Date("2024-07-28T14:15:00"),
      expiresAt: new Date("2024-08-04T14:15:00"),
      status: "accepted",
      acceptedAt: new Date("2024-07-29T16:20:00"),
    },
    {
      id: "inv-003",
      email: "tom.wilson@email.com",
      firstName: "Tom",
      lastName: "Wilson",
      clubName: "Liverpool FC Youth",
      invitedBy: "Mike Director",
      invitedAt: new Date("2024-07-20T11:45:00"),
      expiresAt: new Date("2024-07-27T11:45:00"),
      status: "expired",
    },
    {
      id: "inv-004",
      email: "lisa.brown@email.com",
      firstName: "Lisa",
      lastName: "Brown",
      clubName: "Arsenal Academy",
      invitedBy: "Emma Manager",
      invitedAt: new Date("2024-07-29T09:30:00"),
      expiresAt: new Date("2024-08-05T09:30:00"),
      status: "pending",
    },
    {
      id: "inv-005",
      email: "david.jones@email.com",
      firstName: "",
      lastName: "",
      clubName: "Chelsea FC Academy",
      invitedBy: "Sarah Coach",
      invitedAt: new Date("2024-07-15T16:00:00"),
      expiresAt: new Date("2024-07-22T16:00:00"),
      status: "cancelled",
    },
  ];

  const filteredInvitations = invitations.filter((invitation) => {
    const matchesSearch =
      invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.clubName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || invitation.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      accepted: {
        variant: "default" as const,
        icon: CheckCircle,
        label: "Accepted",
      },
      expired: {
        variant: "destructive" as const,
        icon: XCircle,
        label: "Expired",
      },
      cancelled: {
        variant: "outline" as const,
        icon: XCircle,
        label: "Cancelled",
      },
    };

    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="rounded-lg">
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleResendInvitation = (invitationId: string) => {
    console.log("Resending invitation:", invitationId);
    // TODO: Implement resend functionality
  };

  const handleCancelInvitation = (invitationId: string) => {
    console.log("Cancelling invitation:", invitationId);
    // TODO: Implement cancel functionality
  };

  const handleViewDetails = (invitationId: string) => {
    console.log("View invitation details:", invitationId);
    // TODO: Implement view details functionality
  };

  const getStatusCount = (status: string) => {
    return invitations.filter((inv) => inv.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 m-4">
        <Card className="border-0 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">
                  {getStatusCount("pending")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-xl font-bold text-gray-900">
                  {getStatusCount("accepted")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-xl font-bold text-gray-900">
                  {getStatusCount("expired")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <XCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-xl font-bold text-gray-900">
                  {getStatusCount("cancelled")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitation History
          </CardTitle>
          <CardDescription className="text-gray-600">
            Track and manage all sent invitations ({filteredInvitations.length}{" "}
            total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search invitations by email, name, or club..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Invitations List */}
            <div className="space-y-4">
              {filteredInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No invitations found
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search criteria"
                      : "You haven't sent any invitations yet"}
                  </p>
                </div>
              ) : (
                filteredInvitations.map((invitation) => (
                  <Card
                    key={invitation.id}
                    className="border border-gray-100 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 rounded-xl">
                            <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              <Mail className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {invitation.firstName && invitation.lastName
                                  ? `${invitation.firstName} ${invitation.lastName}`
                                  : invitation.email}
                              </h4>
                              <Badge
                                variant="outline"
                                className="rounded-lg text-xs"
                              >
                                Invitation
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {invitation.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {invitation.clubName}
                            </p>
                          </div>
                        </div>

                        <div className="text-center hidden md:block">
                          <p className="text-sm text-gray-600">Invited by</p>
                          <p className="font-medium text-gray-900">
                            {invitation.invitedBy}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(invitation.invitedAt)} ago
                          </p>
                        </div>

                        <div className="text-center hidden lg:block">
                          <p className="text-sm text-gray-600">Expires</p>
                          <p className="font-medium text-gray-900">
                            {format(invitation.expiresAt, "MMM dd, yyyy")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invitation.status === "pending" &&
                            invitation.expiresAt > new Date()
                              ? `${formatDistanceToNow(
                                  invitation.expiresAt
                                )} left`
                              : invitation.status === "accepted" &&
                                invitation.acceptedAt
                              ? `Accepted ${formatDistanceToNow(
                                  invitation.acceptedAt
                                )} ago`
                              : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(invitation.status)}

                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-gray-200 hover:border-primary hover:text-primary"
                              onClick={() => handleViewDetails(invitation.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {(invitation.status === "pending" ||
                              invitation.status === "expired") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg border-gray-200 hover:border-green-300 hover:text-green-600"
                                onClick={() =>
                                  handleResendInvitation(invitation.id)
                                }
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}

                            {invitation.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg border-gray-200 hover:border-red-300 hover:text-red-600"
                                onClick={() =>
                                  handleCancelInvitation(invitation.id)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile-specific info */}
                      <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <p className="text-gray-600">
                              Invited by {invitation.invitedBy}
                            </p>
                            <p className="text-gray-500">
                              {formatDistanceToNow(invitation.invitedAt)} ago
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600">
                              Expires {format(invitation.expiresAt, "MMM dd")}
                            </p>
                            {invitation.status === "pending" &&
                              invitation.expiresAt > new Date() && (
                                <p className="text-gray-500">
                                  {formatDistanceToNow(invitation.expiresAt)}{" "}
                                  left
                                </p>
                              )}
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
