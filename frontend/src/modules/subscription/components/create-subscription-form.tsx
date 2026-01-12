import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { MembershipTier } from "@/types/subscription";

const subscriptionFormSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  tierId: z.string().min(1, "Please select a membership tier"),
  billingFrequency: z.enum(["monthly", "annual"]),
  billingDayOfMonth: z.coerce.number().min(1).max(28),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface AvailableMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface CreateSubscriptionFormProps {
  members: AvailableMember[];
  tiers: MembershipTier[];
  onSubmit: (data: {
    memberId: number;
    tierId: number;
    billingFrequency: "monthly" | "annual";
    billingDayOfMonth: number;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isLoadingMembers?: boolean;
}

export function CreateSubscriptionForm({
  members,
  tiers,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isLoadingMembers = false,
}: CreateSubscriptionFormProps) {
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      memberId: "",
      tierId: "",
      billingFrequency: "monthly",
      billingDayOfMonth: new Date().getDate() > 28 ? 1 : new Date().getDate(),
    },
  });

  // Update billing frequency when tier changes
  useEffect(() => {
    if (selectedTier) {
      form.setValue("billingFrequency", selectedTier.billingFrequency);
    }
  }, [selectedTier, form]);

  const handleTierChange = (tierId: string) => {
    const tier = tiers.find((t) => t.id.toString() === tierId);
    setSelectedTier(tier || null);
  };

  const handleSubmit = async (values: SubscriptionFormValues) => {
    await onSubmit({
      memberId: parseInt(values.memberId),
      tierId: parseInt(values.tierId),
      billingFrequency: values.billingFrequency,
      billingDayOfMonth: values.billingDayOfMonth,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price);
  };

  const activeTiers = tiers.filter((t) => t.isActive);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select a member"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.length === 0 ? (
                    <SelectItem value="" disabled>
                      No available members
                    </SelectItem>
                  ) : (
                    members.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.first_name} {member.last_name} ({member.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Only members without an active subscription are shown
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
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleTierChange(value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeTiers.length === 0 ? (
                    <SelectItem value="" disabled>
                      No active tiers available
                    </SelectItem>
                  ) : (
                    activeTiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id.toString()}>
                        {tier.name} - {formatPrice(tier.monthlyPrice)}/month
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedTier && (
                <FormDescription>
                  {selectedTier.description || `${formatPrice(selectedTier.monthlyPrice)} monthly, ${formatPrice(selectedTier.annualPrice || selectedTier.monthlyPrice * 12)} annually`}
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
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              {selectedTier && (
                <FormDescription>
                  Amount: {field.value === "annual"
                    ? formatPrice(selectedTier.annualPrice || selectedTier.monthlyPrice * 12)
                    : formatPrice(selectedTier.monthlyPrice)}
                  {field.value === "annual" ? "/year" : "/month"}
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
              <FormLabel>Billing Day of Month</FormLabel>
              <Select onValueChange={field.onChange} value={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The day of each month when billing occurs (1-28)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || members.length === 0 || activeTiers.length === 0}>
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
