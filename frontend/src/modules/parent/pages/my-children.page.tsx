import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  AlertCircle,
  User,
  Users,
  Calendar,
  Receipt,
  Pencil,
} from "lucide-react";
import {
  ChildProfileSection,
  ChildScheduleSection,
  ChildInvoicesSection,
  ChildTeamsSection,
  EditChildDialog,
  AddChildDialog,
} from "../components";
import { fetchParentChildren, fetchChildDetails } from "../actions";
import type { EnrichedChild, ChildDetailData } from "../types";

type TabValue = "profile" | "schedule" | "invoices" | "teams";

export function MyChildrenPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Children list state
  const [children, setChildren] = useState<EnrichedChild[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Selected child state
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childDetail, setChildDetail] = useState<ChildDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const activeTab = (searchParams.get("tab") as TabValue) || "profile";

  // Load children list on mount
  useEffect(() => {
    loadChildren();
  }, []);

  // Auto-select first child when list loads
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      const urlChildId = searchParams.get("childId");
      if (urlChildId && children.some(c => c.id.toString() === urlChildId)) {
        setSelectedChildId(urlChildId);
      } else {
        setSelectedChildId(children[0].id.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  // Load child details when selection changes
  useEffect(() => {
    if (selectedChildId) {
      loadChildDetails(selectedChildId);
    }
  }, [selectedChildId]);

  const loadChildren = async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const data = await fetchParentChildren();
      setChildren(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load children");
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadChildDetails = async (childId: string) => {
    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const data = await fetchChildDetails(childId);
      setChildDetail(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to load child details");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("childId", childId);
    setSearchParams(newParams);
  };

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    if (selectedChildId) {
      newParams.set("childId", selectedChildId);
    }
    setSearchParams(newParams);
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    loadChildren();
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    if (selectedChildId) {
      loadChildDetails(selectedChildId);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Loading state
  if (isLoadingList) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-10 w-32 bg-gray-200 rounded" />
          </div>
          <div className="h-12 w-64 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (listError) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Children</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {listError}
            <Button variant="link" className="ml-2 p-0 h-auto" onClick={loadChildren}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (children.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Children</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your children's information
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No children registered yet</h2>
            <p className="text-muted-foreground mb-6">
              Add your first child to start managing their activities
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>

        <AddChildDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSuccess={handleAddSuccess}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Children</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your children's information
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Child
        </Button>
      </div>

      {/* Simple Child Selector */}
      <Select value={selectedChildId || ""} onValueChange={handleChildSelect}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select a child" />
        </SelectTrigger>
        <SelectContent>
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id.toString()}>
              {child.firstName} {child.lastName} ({calculateAge(child.dateOfBirth)} yrs)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Loading Detail */}
      {isLoadingDetail && (
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      )}

      {/* Detail Error */}
      {detailError && !isLoadingDetail && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {detailError}
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={() => selectedChildId && loadChildDetails(selectedChildId)}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Child Detail Card */}
      {childDetail && !isLoadingDetail && (
        <>
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {childDetail.firstName} {childDetail.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={childDetail.enrollmentStatus === "Active" ? "default" : "secondary"}>
                      {childDetail.enrollmentStatus}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {calculateAge(childDetail.dateOfBirth)} years old
                      {childDetail.position && ` • ${childDetail.position}`}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                    {childDetail.upcomingEventsCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {childDetail.upcomingEventsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="gap-2">
                    <Receipt className="h-4 w-4" />
                    Invoices
                    {childDetail.pendingInvoices.count > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                        {childDetail.pendingInvoices.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="teams" className="gap-2">
                    <Users className="h-4 w-4" />
                    Teams
                    {childDetail.teams.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {childDetail.teams.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                  <ChildProfileSection child={childDetail} />
                </TabsContent>

                <TabsContent value="schedule" className="mt-6">
                  <ChildScheduleSection child={childDetail} />
                </TabsContent>

                <TabsContent value="invoices" className="mt-6">
                  <ChildInvoicesSection child={childDetail} />
                </TabsContent>

                <TabsContent value="teams" className="mt-6">
                  <ChildTeamsSection child={childDetail} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Edit Child Dialog */}
          <EditChildDialog
            open={showEditDialog}
            onClose={() => setShowEditDialog(false)}
            onSuccess={handleEditSuccess}
            child={childDetail}
          />
        </>
      )}

      {/* Add Child Dialog */}
      <AddChildDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
