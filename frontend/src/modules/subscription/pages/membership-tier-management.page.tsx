import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MembershipTierForm, MembershipTierList } from "../components";
import {
  fetchMembershipTiers,
  fetchMembershipTierStats,
  createMembershipTier,
  updateMembershipTier,
} from "../actions/subscription-actions";
import type {
  MembershipTier,
  MembershipTierStats,
  CreateMembershipTierRequest,
} from "@/types/subscription";

export function MembershipTierManagementPage() {
  const { toast } = useToast();

  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [stats, setStats] = useState<MembershipTierStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tiersData, statsData] = await Promise.all([
        fetchMembershipTiers(true),
        fetchMembershipTierStats(),
      ]);
      setTiers(tiersData);
      setStats(statsData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load membership tiers";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTier = () => {
    setEditingTier(null);
    setDialogOpen(true);
  };

  const handleEditTier = (tier: MembershipTier) => {
    setEditingTier(tier);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateMembershipTierRequest) => {
    try {
      setIsSubmitting(true);
      if (editingTier) {
        await updateMembershipTier(editingTier.id, data);
        toast({
          title: "Success",
          description: "Membership tier updated successfully",
        });
      } else {
        await createMembershipTier(data);
        toast({
          title: "Success",
          description: "Membership tier created successfully",
        });
      }
      setDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save membership tier";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Membership Tiers
          </h1>
          <p className="text-sm text-gray-500">
            Configure subscription levels and pricing.
          </p>
        </div>
        <Button
          onClick={handleCreateTier}
          className="rounded-xl gradient-primary text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Tier
        </Button>
      </div>

      {/* Tier List */}
      <MembershipTierList
        tiers={tiers}
        stats={stats}
        onEdit={handleEditTier}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? "Edit Membership Tier" : "Create Membership Tier"}
            </DialogTitle>
            <DialogDescription>
              {editingTier
                ? "Update the details for this membership tier."
                : "Set up a new membership tier with pricing and features."}
            </DialogDescription>
          </DialogHeader>
          <MembershipTierForm
            tier={editingTier || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
