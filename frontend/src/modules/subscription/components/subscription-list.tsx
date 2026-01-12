import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, XCircle, Eye } from "lucide-react";
import type { Subscription } from "@/types/subscription";
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  BILLING_FREQUENCY_LABELS,
} from "@/types/subscription";

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onViewDetails: (subscription: Subscription) => void;
  onCancel: (subscriptionId: number, reason?: string, immediate?: boolean) => Promise<void>;
  isCancelling?: boolean;
}

export function SubscriptionList({
  subscriptions,
  onViewDetails,
  onCancel,
  isCancelling = false,
}: SubscriptionListProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleCancelClick = (subscription: Subscription) => {
    setSubscriptionToCancel(subscription);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (subscriptionToCancel) {
      await onCancel(subscriptionToCancel.id);
      setCancelDialogOpen(false);
      setSubscriptionToCancel(null);
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No subscriptions found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {subscription.child_first_name} {subscription.child_last_name}
                    </p>
                    {subscription.parent_first_name && (
                      <p className="text-sm text-muted-foreground">
                        Parent: {subscription.parent_first_name}{" "}
                        {subscription.parent_last_name}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{subscription.tier_name || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={SUBSCRIPTION_STATUS_COLORS[subscription.status]}
                  >
                    {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {BILLING_FREQUENCY_LABELS[subscription.billing_frequency]}
                </TableCell>
                <TableCell>{formatPrice(subscription.amount)}</TableCell>
                <TableCell>{formatDate(subscription.next_billing_date)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(subscription)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {subscription.status === "active" && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleCancelClick(subscription)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the subscription for{" "}
              {subscriptionToCancel?.child_first_name}{" "}
              {subscriptionToCancel?.child_last_name}? The subscription will remain
              active until the end of the current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
