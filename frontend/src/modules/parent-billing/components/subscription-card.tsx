import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pause,
  Play,
  XCircle,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import type { Subscription } from "@/types/subscription";
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  BILLING_FREQUENCY_LABELS,
} from "@/types/subscription";

interface SubscriptionCardProps {
  subscription: Subscription;
  onPause: (subscriptionId: number) => void;
  onResume: (subscriptionId: number) => void;
  onCancel: (subscriptionId: number) => void;
  onChangeTier: (subscriptionId: number) => void;
}

export function SubscriptionCard({
  subscription,
  onPause,
  onResume,
  onCancel,
  onChangeTier,
}: SubscriptionCardProps) {
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
      month: "long",
      year: "numeric",
    });
  };

  const canPause = subscription.status === "active";
  const canResume = subscription.status === "paused";
  const canCancel = ["active", "paused"].includes(subscription.status);
  const canChangeTier = subscription.status === "active";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {subscription.child_first_name} {subscription.child_last_name}
            </CardTitle>
            <CardDescription>
              {subscription.tier_name} - {subscription.club_name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={SUBSCRIPTION_STATUS_COLORS[subscription.status]}
            >
              {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canChangeTier && (
                  <DropdownMenuItem onClick={() => onChangeTier(subscription.id)}>
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Change Tier
                  </DropdownMenuItem>
                )}
                {canPause && (
                  <DropdownMenuItem onClick={() => onPause(subscription.id)}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Subscription
                  </DropdownMenuItem>
                )}
                {canResume && (
                  <DropdownMenuItem onClick={() => onResume(subscription.id)}>
                    <Play className="mr-2 h-4 w-4" />
                    Resume Subscription
                  </DropdownMenuItem>
                )}
                {(canPause || canResume || canChangeTier) && canCancel && (
                  <DropdownMenuSeparator />
                )}
                {canCancel && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onCancel(subscription.id)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-lg font-semibold">
              {formatPrice(subscription.amount)}
              <span className="text-sm font-normal text-muted-foreground">
                /{BILLING_FREQUENCY_LABELS[subscription.billing_frequency].toLowerCase()}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Billing Day</p>
            <p className="text-lg font-semibold">
              {subscription.billing_day_of_month}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}of each month
              </span>
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current Period</p>
            <p>
              {formatDate(subscription.current_period_start)} -{" "}
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Next Billing Date</p>
            <p className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(subscription.next_billing_date)}
            </p>
          </div>
        </div>

        {subscription.status === "suspended" && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              This subscription is suspended due to payment failures.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please update your payment method to reactivate.
            </p>
          </div>
        )}

        {subscription.status === "paused" && subscription.resume_date && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Scheduled to resume on {formatDate(subscription.resume_date)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
