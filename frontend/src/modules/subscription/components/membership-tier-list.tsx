import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react";
import type { MembershipTier, MembershipTierStats } from "@/types/subscription";
import { BILLING_FREQUENCY_LABELS } from "@/types/subscription";

interface MembershipTierListProps {
  tiers: MembershipTier[];
  stats?: MembershipTierStats[];
  onEdit: (tier: MembershipTier) => void;
  onDelete: (tierId: number) => Promise<void>;
  isDeleting?: boolean;
}

export function MembershipTierList({
  tiers,
  stats,
  onEdit,
  onDelete,
  isDeleting = false,
}: MembershipTierListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<MembershipTier | null>(null);

  const getStatsForTier = (tierId: number) => {
    return stats?.find((s) => s.tierId === tierId);
  };

  const handleDeleteClick = (tier: MembershipTier) => {
    setTierToDelete(tier);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (tierToDelete) {
      await onDelete(tierToDelete.id);
      setDeleteDialogOpen(false);
      setTierToDelete(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price);
  };

  if (tiers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No membership tiers created yet.
            <br />
            Create your first tier to start accepting subscriptions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tiers.map((tier) => {
          const tierStats = getStatsForTier(tier.id);
          return (
            <Card key={tier.id} className={!tier.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        {!tier.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      {tier.description && (
                        <CardDescription className="mt-1">
                          {tier.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(tier)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteClick(tier)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly</p>
                    <p className="text-lg font-semibold">
                      {formatPrice(tier.monthlyPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annual</p>
                    <p className="text-lg font-semibold">
                      {tier.annualPrice
                        ? formatPrice(tier.annualPrice)
                        : formatPrice(tier.monthlyPrice * 12)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Default Billing</p>
                    <p className="text-lg font-semibold">
                      {BILLING_FREQUENCY_LABELS[tier.billingFrequency]}
                    </p>
                  </div>
                  {tierStats && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Active Subscriptions
                      </p>
                      <p className="text-lg font-semibold">
                        {tierStats.activeSubscriptions}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Membership Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tierToDelete?.name}"? This action
              cannot be undone.
              {tierToDelete && getStatsForTier(tierToDelete.id)?.activeSubscriptions ? (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This tier has active subscriptions. You cannot delete it
                  until all subscriptions are cancelled or moved to another tier.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
