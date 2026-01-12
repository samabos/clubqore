import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionCard, CreateParentSubscriptionForm } from "../components";
import {
  fetchParentSubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelParentSubscription,
  createParentSubscription,
  fetchAvailableTiers,
} from "@/modules/subscription/actions/subscription-actions";
import { fetchParentChildren } from "@/modules/parent/actions/parent-children-actions";
import type { Subscription, SubscriptionStatus, MembershipTier } from "@/types/subscription";
import type { EnrichedChild } from "@/modules/parent/types";

export function ParentSubscriptionManagementPage() {
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New subscription dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [children, setChildren] = useState<EnrichedChild[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // For now, hardcode clubId - in a real app, this would come from context or be selected
  const [currentClubId] = useState<number | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter]);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      const filters =
        statusFilter !== "all" ? { status: statusFilter as SubscriptionStatus } : {};
      const data = await fetchParentSubscriptions(filters);
      setSubscriptions(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
    setPauseDialogOpen(true);
  };

  const handleConfirmPause = async () => {
    if (!selectedSubscriptionId) return;
    try {
      setIsProcessing(true);
      await pauseSubscription(selectedSubscriptionId);
      toast({
        title: "Success",
        description: "Subscription paused successfully",
      });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to pause subscription",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setPauseDialogOpen(false);
      setSelectedSubscriptionId(null);
    }
  };

  const handleResume = async (subscriptionId: number) => {
    try {
      await resumeSubscription(subscriptionId);
      toast({
        title: "Success",
        description: "Subscription resumed successfully",
      });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resume subscription",
        variant: "destructive",
      });
    }
  };

  const handleCancel = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSubscriptionId) return;
    try {
      setIsProcessing(true);
      await cancelParentSubscription(selectedSubscriptionId);
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCancelDialogOpen(false);
      setSelectedSubscriptionId(null);
    }
  };

  const handleChangeTier = (subscriptionId: number) => {
    // TODO: Implement tier change dialog
    toast({
      title: "Coming Soon",
      description: "Tier change functionality will be available soon",
    });
  };

  const handleOpenCreateDialog = async () => {
    setShowCreateDialog(true);

    // Load children
    setIsLoadingChildren(true);
    try {
      const childrenData = await fetchParentChildren();
      setChildren(childrenData);

      // Get club ID from first child's club if available
      if (childrenData.length > 0 && childrenData[0].clubId) {
        const clubId = parseInt(childrenData[0].clubId);
        // Load tiers for the club
        setIsLoadingTiers(true);
        try {
          const tiersData = await fetchAvailableTiers(clubId);
          setTiers(tiersData);
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to load membership tiers",
            variant: "destructive",
          });
        } finally {
          setIsLoadingTiers(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load children",
        variant: "destructive",
      });
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const handleCreateSubscription = async (data: {
    childId: number;
    tierId: number;
    billingFrequency: "monthly" | "annual";
    billingDayOfMonth: number;
  }) => {
    // Find the child's club ID
    const child = children.find(
      (c) => c.childUserId?.toString() === data.childId.toString() || c.id.toString() === data.childId.toString()
    );
    const clubId = child?.clubId ? parseInt(child.clubId) : currentClubId;

    if (!clubId) {
      toast({
        title: "Error",
        description: "Could not determine the club for this subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      await createParentSubscription(
        clubId,
        data.childId,
        data.tierId,
        undefined, // paymentMandateId - will be set up later
        data.billingDayOfMonth,
        data.billingFrequency
      );
      toast({
        title: "Success",
        description: "Subscription created successfully. Set up a payment method to activate it.",
      });
      setShowCreateDialog(false);
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your children's club memberships
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subscriptions</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Subscription
          </Button>
        </div>
      </div>

      {/* Subscription List */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {statusFilter === "all"
            ? "No subscriptions found. Create a subscription when joining a club."
            : `No ${statusFilter} subscriptions found.`}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
              onChangeTier={handleChangeTier}
            />
          ))}
        </div>
      )}

      {/* Pause Dialog */}
      <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to pause this subscription? You won't be
              charged while paused, but access may be limited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPause} disabled={isProcessing}>
              {isProcessing ? "Pausing..." : "Pause Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription? The subscription
              will remain active until the end of the current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Cancelling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Subscription Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Subscription</DialogTitle>
            <DialogDescription>
              Create a new subscription for your child. The subscription will be
              created in pending status until you set up a payment method.
            </DialogDescription>
          </DialogHeader>
          <CreateParentSubscriptionForm
            children={children}
            tiers={tiers}
            clubId={currentClubId || 0}
            onSubmit={handleCreateSubscription}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={isCreating}
            isLoadingChildren={isLoadingChildren}
            isLoadingTiers={isLoadingTiers}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
