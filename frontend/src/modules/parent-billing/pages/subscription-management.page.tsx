import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { SubscriptionCard } from "../components";
import {
  fetchParentSubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelParentSubscription,
} from "@/modules/subscription/actions/subscription-actions";
import type { Subscription, SubscriptionStatus } from "@/types/subscription";

export function ParentSubscriptionManagementPage() {
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Subscriptions are automatically created when your child is assigned to a team by the club manager.
          Set up a payment method to activate your subscriptions.
        </p>
      </div>

      {/* Subscription List */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {statusFilter === "all"
            ? "No subscriptions found. A subscription will be created when your child is assigned to a team."
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
    </div>
  );
}
