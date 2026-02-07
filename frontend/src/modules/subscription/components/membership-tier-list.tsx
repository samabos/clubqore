import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, CreditCard } from "lucide-react";
import type { MembershipTier, MembershipTierStats } from "@/types/subscription";
import { BILLING_FREQUENCY_LABELS } from "@/types/subscription";

interface MembershipTierListProps {
  tiers: MembershipTier[];
  stats?: MembershipTierStats[];
  onEdit: (tier: MembershipTier) => void;
}

export function MembershipTierList({
  tiers,
  stats,
  onEdit,
}: MembershipTierListProps) {
  const getStatsForTier = (tierId: number) => {
    return stats?.find((s) => s.tierId === tierId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price);
  };

  if (tiers.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Membership Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No membership tiers yet
            </h3>
            <p className="text-gray-500">
              Create your first tier to start accepting subscriptions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Membership Tiers ({tiers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Annual</TableHead>
              <TableHead>Default Billing</TableHead>
              <TableHead className="text-center">Subscriptions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier) => {
              const tierStats = getStatsForTier(tier.id);
              return (
                <TableRow key={tier.id} className={!tier.isActive ? "opacity-60" : ""}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{tier.name}</span>
                      {tier.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(tier.monthlyPrice)}</TableCell>
                  <TableCell>
                    {tier.annualPrice
                      ? formatPrice(tier.annualPrice)
                      : formatPrice(tier.monthlyPrice * 12)}
                  </TableCell>
                  <TableCell>{BILLING_FREQUENCY_LABELS[tier.billingFrequency]}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{tierStats?.activeSubscriptions || 0}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tier.isActive ? "default" : "secondary"}
                      className={
                        tier.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : ""
                      }
                    >
                      {tier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(tier)}
                      title="Edit Tier"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
