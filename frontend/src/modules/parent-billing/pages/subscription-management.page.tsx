import { useEffect, useState } from "react";
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
import type { Subscription } from "@/types/subscription";

export function ParentSubscriptionManagementPage() {
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      const data = await fetchParentSubscriptions({});
      setSubscriptions(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load subscriptions";
      toast({
        title: "Error",
        description: message,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to pause subscription";
      toast({
        title: "Error",
        description: message,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to resume subscription";
      toast({
        title: "Error",
        description: message,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to cancel subscription";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCancelDialogOpen(false);
      setSelectedSubscriptionId(null);
    }
  };

  const handleChangeTier = (_subscriptionId: number) => {
    void _subscriptionId; // Will be used when tier change is implemented
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
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">
          Manage your children's club memberships
        </p>
      </div>

      {/* Subscription List */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No subscriptions yet. A subscription will be created when your child is assigned to a team.
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
