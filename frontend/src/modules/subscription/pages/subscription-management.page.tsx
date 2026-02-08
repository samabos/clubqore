import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionList, SubscriptionStats } from "../components";
import {
  fetchSubscriptions,
  fetchSubscriptionStats,
  fetchMembershipTiers,
  cancelSubscription,
} from "../actions/subscription-actions";
import type {
  Subscription,
  SubscriptionStats as SubscriptionStatsType,
  SubscriptionFilters,
  MembershipTier,
  SubscriptionStatus,
} from "@/types/subscription";

/**
 * Subscription Management Page
 *
 * Note: Manual subscription creation has been removed.
 * Subscriptions are created through the parent onboarding flow when
 * parents set up payment for their children's membership.
 */
export function SubscriptionManagementPage() {
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStatsType | null>(null);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [subsData, statsData, tiersData] = await Promise.all([
        fetchSubscriptions(filters),
        fetchSubscriptionStats(),
        fetchMembershipTiers(),
      ]);
      setSubscriptions(subsData);
      setStats(statsData);
      setTiers(tiersData);
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

  const loadSubscriptions = async () => {
    try {
      const subsData = await fetchSubscriptions(filters);
      setSubscriptions(subsData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load subscriptions";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (subscription: Subscription) => {
    // TODO: Navigate to subscription detail page or open modal
    console.log("View details:", subscription);
  };

  const handleCancelSubscription = async (subscriptionId: number) => {
    try {
      setIsCancelling(true);
      await cancelSubscription(subscriptionId);
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
      loadSubscriptions();
      // Refresh stats
      const statsData = await fetchSubscriptionStats();
      setStats(statsData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to cancel subscription";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : (value as SubscriptionStatus),
    }));
  };

  const handleTierChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      tierId: value === "all" ? undefined : parseInt(value),
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchTerm || undefined,
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid gap-4 md:grid-cols-4">
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
          <div className="h-96 bg-gray-200 rounded" />
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
            View and manage member subscriptions
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/app/membership-tiers">
            <Settings className="mr-2 h-4 w-4" />
            Manage Tiers
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {stats && <SubscriptionStats stats={stats} />}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by member name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </form>

        <Select
          value={filters.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.tierId?.toString() || "all"}
          onValueChange={handleTierChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {tiers.map((tier) => (
              <SelectItem key={tier.id} value={tier.id.toString()}>
                {tier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subscription List */}
      <SubscriptionList
        subscriptions={subscriptions}
        onViewDetails={handleViewDetails}
        onCancel={handleCancelSubscription}
        isCancelling={isCancelling}
      />
    </div>
  );
}
