import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MembershipTierForm, MembershipTierList } from "../components";
import {
  fetchMembershipTiers,
  fetchMembershipTierStats,
  createMembershipTier,
  updateMembershipTier,
  deleteMembershipTier,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tiersData, statsData] = await Promise.all([
        fetchMembershipTiers(showInactive),
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

  const handleDeleteTier = async (tierId: number) => {
    try {
      setIsDeleting(true);
      await deleteMembershipTier(tierId);
      toast({
        title: "Success",
        description: "Membership tier deleted successfully",
      });
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete membership tier";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
          <h1 className="text-3xl font-bold">Membership Tiers</h1>
          <p className="text-muted-foreground mt-1">
            Configure subscription levels and pricing for your members
          </p>
        </div>
        <Button onClick={handleCreateTier}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tier
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Switch
          id="show-inactive"
          checked={showInactive}
          onCheckedChange={setShowInactive}
        />
        <Label htmlFor="show-inactive">Show inactive tiers</Label>
      </div>

      {/* Tier List */}
      <MembershipTierList
        tiers={tiers}
        stats={stats}
        onEdit={handleEditTier}
        onDelete={handleDeleteTier}
        isDeleting={isDeleting}
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
