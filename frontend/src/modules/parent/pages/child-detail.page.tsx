import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, User, Users, Calendar, Receipt, Pencil } from "lucide-react";
import {
  ChildProfileSection,
  ChildScheduleSection,
  ChildInvoicesSection,
  ChildTeamsSection,
  EditChildDialog,
} from "../components";
import { fetchChildDetails } from "../actions";
import type { ChildDetailData } from "../types";

type TabValue = "profile" | "schedule" | "invoices" | "teams";

export function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [child, setChild] = useState<ChildDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const activeTab = (searchParams.get("tab") as TabValue) || "profile";

  useEffect(() => {
    if (childId) {
      loadChildDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const loadChildDetails = async () => {
    if (!childId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchChildDetails(childId);
      setChild(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load child details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleBack = () => {
    navigate("/app/parent/children");
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    loadChildDetails(); // Refresh data after successful edit
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Child not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={child.profileImage || undefined}
                alt={`${child.firstName} ${child.lastName}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(child.firstName, child.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {child.firstName} {child.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={child.enrollmentStatus === "Active" ? "default" : "secondary"}>
                  {child.enrollmentStatus}
                </Badge>
                <span className="text-sm text-gray-600">
                  {calculateAge(child.dateOfBirth)} years old
                  {child.position && ` • ${child.position}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <Button
          variant="outline"
          onClick={() => setShowEditDialog(true)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Teams</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{child.teams.length}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Events</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{child.upcomingEventsCount}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Invoices</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{child.pendingInvoices.count}</p>
                <span className={`text-sm font-medium ${child.pendingInvoices.count > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {child.pendingInvoices.count > 0 ? 'Pending' : 'None'}
                </span>
              </div>
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${child.pendingInvoices.count > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <Receipt className={`w-5 h-5 lg:w-6 lg:h-6 ${child.pendingInvoices.count > 0 ? 'text-amber-600' : 'text-gray-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Amount Due</p>
                <p className={`text-xl lg:text-2xl font-bold ${child.pendingInvoices.total > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  ${child.pendingInvoices.total.toFixed(2)}
                </p>
              </div>
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${child.pendingInvoices.total > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <Receipt className={`w-5 h-5 lg:w-6 lg:h-6 ${child.pendingInvoices.total > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2">
                <Receipt className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="teams" className="gap-2">
                <Users className="h-4 w-4" />
                Teams
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-0">
              <ChildProfileSection child={child} />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <ChildScheduleSection child={child} />
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              <ChildInvoicesSection child={child} />
            </TabsContent>

            <TabsContent value="teams" className="mt-0">
              <ChildTeamsSection child={child} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Child Dialog */}
      <EditChildDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleEditSuccess}
        child={child}
      />
    </div>
  );
}
