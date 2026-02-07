import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Calendar, PoundSterling } from "lucide-react";
import type { ChildDetailData } from "../types";

interface ChildTeamsSectionProps {
  child: ChildDetailData;
}

export function ChildTeamsSection({ child }: ChildTeamsSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (tier: { monthlyPrice: number; annualPrice: number | null; billingFrequency: string }) => {
    // Handle null/undefined prices to prevent NaN
    const price = tier.billingFrequency === "annual" && tier.annualPrice != null
      ? tier.annualPrice
      : tier.monthlyPrice;

    // Return null if price is not a valid number
    if (price == null || isNaN(price)) {
      return null;
    }

    const formattedPrice = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price);
    return `${formattedPrice}/${tier.billingFrequency === "annual" ? "year" : "month"}`;
  };

  if (child.teams.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Not assigned to any teams yet</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            <TableHead>Subscription Plan</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {child.teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {team.name}
                </div>
              </TableCell>
              <TableCell>
                {team.membershipTier ? (
                  <Badge variant="secondary">
                    {team.membershipTier.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">No subscription plan</span>
                )}
              </TableCell>
              <TableCell>
                {team.membershipTier ? (
                  (() => {
                    const price = formatPrice(team.membershipTier);
                    return price ? (
                      <div className="flex items-center gap-1 text-sm">
                        <PoundSterling className="h-3 w-3 text-muted-foreground" />
                        {price}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {team.assigned_at ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(team.assigned_at)}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
