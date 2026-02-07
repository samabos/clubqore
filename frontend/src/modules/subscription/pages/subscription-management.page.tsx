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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionList, SubscriptionStats, CreateSubscriptionForm } from "../components";
import {
  fetchSubscriptions,
  fetchSubscriptionStats,
  fetchMembershipTiers,
  fetchAvailableMembers,
  createSubscriptionForMember,
  cancelSubscription,
} from "../actions/subscription-actions";
import type {
  Subscription,
  SubscriptionStats as SubscriptionStatsType,
  SubscriptionFilters,
  MembershipTier,
  SubscriptionStatus,
} from "@/types/subscription";

interface AvailableMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  team_name?: string;
}

export function SubscriptionManagementPage() {
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStatsType | null>(null);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  const loadAvailableMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const members = await fetchAvailableMembers();
      setAvailableMembers(members);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load available members";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setShowCreateDialog(true);
    loadAvailableMembers();
  };

  const handleCreateSubscription = async (data: {
    memberId: number;
    tierId: number;
    billingFrequency: "monthly" | "annual";
    billingDayOfMonth: number;
  }) => {
    try {
      setIsCreating(true);
      await createSubscriptionForMember(
        data.memberId,
        data.tierId,
        data.billingFrequency,
        data.billingDayOfMonth
      );
      toast({
        title: "Success",
        description: "Subscription created successfully",
      });
      setShowCreateDialog(false);
      // Refresh data
      loadSubscriptions();
      const statsData = await fetchSubscriptionStats();
      setStats(statsData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create subscription";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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
            Manage member subscriptions and monitor billing
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Subscription
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

      {/* Create Subscription Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Subscription</DialogTitle>
            <DialogDescription>
              Add a member to a membership tier. The subscription will be created
              in pending status until payment is set up.
            </DialogDescription>
          </DialogHeader>
          <CreateSubscriptionForm
            members={availableMembers}
            tiers={tiers}
            onSubmit={handleCreateSubscription}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={isCreating}
            isLoadingMembers={isLoadingMembers}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
