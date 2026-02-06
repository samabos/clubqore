import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { MembershipTier } from "@/types/subscription";
import type { EnrichedChild } from "@/modules/parent/types";
import { BILLING_FREQUENCY_LABELS } from "@/types/subscription";

const parentSubscriptionFormSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  tierId: z.string().min(1, "Please select a membership tier"),
  billingFrequency: z.enum(["monthly", "annual"]),
  billingDayOfMonth: z.coerce
    .number()
    .min(1, "Billing day must be at least 1")
    .max(28, "Billing day must be at most 28"),
});

type ParentSubscriptionFormData = z.infer<typeof parentSubscriptionFormSchema>;

interface CreateParentSubscriptionFormProps {
  children: EnrichedChild[];
  tiers: MembershipTier[];
  clubId: number;
  onSubmit: (data: {
    childId: number;
    tierId: number;
    billingFrequency: "monthly" | "annual";
    billingDayOfMonth: number;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isLoadingChildren?: boolean;
  isLoadingTiers?: boolean;
}

export function CreateParentSubscriptionForm({
  children,
  tiers,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isLoadingChildren = false,
  isLoadingTiers = false,
}: CreateParentSubscriptionFormProps) {
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);

  const form = useForm<ParentSubscriptionFormData>({
    resolver: zodResolver(parentSubscriptionFormSchema),
    defaultValues: {
      childId: "",
      tierId: "",
      billingFrequency: "monthly",
      billingDayOfMonth: new Date().getDate() > 28 ? 1 : new Date().getDate(),
    },
  });

  const billingFrequency = form.watch("billingFrequency");

  const watchedTierId = form.watch("tierId");

  useEffect(() => {
    if (watchedTierId) {
      const tier = tiers.find((t) => t.id.toString() === watchedTierId);
      setSelectedTier(tier || null);
    } else {
      setSelectedTier(null);
    }
  }, [watchedTierId, tiers]);

  const handleSubmit = async (data: ParentSubscriptionFormData) => {
    await onSubmit({
      childId: parseInt(data.childId),
      tierId: parseInt(data.tierId),
      billingFrequency: data.billingFrequency,
      billingDayOfMonth: data.billingDayOfMonth,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price);
  };

  const getAmount = () => {
    if (!selectedTier) return null;
    return billingFrequency === "annual"
      ? selectedTier.annualPrice
      : selectedTier.monthlyPrice;
  };

  // Filter children without active subscriptions (would need backend to provide this info)
  // For now, show all children
  const availableChildren = children;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="childId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    {isLoadingChildren ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading children...
                      </span>
                    ) : (
                      <SelectValue placeholder="Select a child" />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableChildren.length === 0 ? (
                    <SelectItem value="no-children" disabled>
                      No children available
                    </SelectItem>
                  ) : (
                    availableChildren.map((child) => (
                      <SelectItem
                        key={child.id}
                        value={child.childUserId?.toString() || child.id.toString()}
                      >
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select which child to create the subscription for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Membership Tier</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    {isLoadingTiers ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading tiers...
                      </span>
                    ) : (
                      <SelectValue placeholder="Select a membership tier" />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiers.length === 0 ? (
                    <SelectItem value="no-tiers" disabled>
                      No tiers available
                    </SelectItem>
                  ) : (
                    tiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id.toString()}>
                        {tier.name} - {formatPrice(tier.monthlyPrice)}/month
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedTier && (
                <FormDescription>
                  {selectedTier.description || `${selectedTier.name} membership`}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Frequency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">
                    {BILLING_FREQUENCY_LABELS.monthly}
                  </SelectItem>
                  <SelectItem value="annual">
                    {BILLING_FREQUENCY_LABELS.annual}
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedTier && (
                <FormDescription>
                  {billingFrequency === "annual"
                    ? `${formatPrice(selectedTier.annualPrice)} per year`
                    : `${formatPrice(selectedTier.monthlyPrice)} per month`}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingDayOfMonth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Day</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Day of the month when billing occurs (1-28)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedTier && (
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Subscription Summary</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Tier:</span>{" "}
                {selectedTier.name}
              </p>
              <p>
                <span className="text-muted-foreground">Amount:</span>{" "}
                {formatPrice(getAmount() || 0)}/{billingFrequency === "annual" ? "year" : "month"}
              </p>
              <p>
                <span className="text-muted-foreground">Billing Day:</span>{" "}
                {form.watch("billingDayOfMonth")} of each {billingFrequency === "annual" ? "year" : "month"}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingChildren || isLoadingTiers}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Subscription"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
