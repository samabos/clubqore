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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MembershipTier, CreateMembershipTierRequest } from "@/types/subscription";

const tierFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  monthlyPrice: z.number().min(0, "Price must be positive"),
  annualPrice: z.number().min(0, "Price must be positive").nullable(),
  billingFrequency: z.enum(["monthly", "annual"]),
  isActive: z.boolean(),
});

type TierFormValues = z.infer<typeof tierFormSchema>;

interface MembershipTierFormProps {
  tier?: MembershipTier;
  onSubmit: (data: CreateMembershipTierRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MembershipTierForm({
  tier,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MembershipTierFormProps) {
  const form = useForm<TierFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tierFormSchema) as any,
    defaultValues: {
      name: tier?.name || "",
      description: tier?.description || "",
      monthlyPrice: tier?.monthlyPrice || 0,
      annualPrice: tier?.annualPrice || null,
      billingFrequency: tier?.billingFrequency || "monthly",
      isActive: tier?.isActive ?? true,
    },
  });

  const handleSubmit = async (values: TierFormValues) => {
    await onSubmit({
      name: values.name,
      description: values.description,
      monthlyPrice: values.monthlyPrice,
      annualPrice: values.annualPrice || undefined,
      billingFrequency: values.billingFrequency,
      isActive: values.isActive,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tier Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Bronze, Silver, Gold" {...field} />
              </FormControl>
              <FormDescription>
                The name displayed to members when selecting a membership level
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what's included in this tier..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthlyPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      £
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      placeholder="0.00"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="annualPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Price (Optional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      £
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </div>
                </FormControl>
                <FormDescription>Leave empty to use monthly price x 12</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="billingFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Billing Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The default billing frequency for new subscriptions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  When disabled, this tier won't be available for new subscriptions
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : tier ? "Update Tier" : "Create Tier"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
