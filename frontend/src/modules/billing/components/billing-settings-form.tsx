import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, DollarSign, Calendar, AlertCircle } from "lucide-react";
import {
  UpdateBillingSettingsRequest,
  BillingSettings,
  ItemCategory,
  ITEM_CATEGORY_LABELS,
} from "@/types/billing";

interface BillingSettingsFormProps {
  settings: BillingSettings;
  onSubmit: (data: UpdateBillingSettingsRequest) => Promise<void>;
  isLoading?: boolean;
  isSuperAdmin?: boolean; // Only super admin can edit service charge settings
}

export function BillingSettingsForm({
  settings,
  onSubmit,
  isLoading,
  isSuperAdmin = false,
}: BillingSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateBillingSettingsRequest>({
    defaultValues: {
      service_charge_enabled: settings.service_charge_enabled,
      service_charge_type: settings.service_charge_type,
      service_charge_value: settings.service_charge_value,
      service_charge_description: settings.service_charge_description,
      auto_generation_enabled: settings.auto_generation_enabled,
      days_before_season: settings.days_before_season,
      default_invoice_items: settings.default_invoice_items || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "default_invoice_items",
  });

  // Reset form when settings change (e.g., when different club is selected)
  useEffect(() => {
    form.reset({
      service_charge_enabled: settings.service_charge_enabled,
      service_charge_type: settings.service_charge_type,
      service_charge_value: settings.service_charge_value,
      service_charge_description: settings.service_charge_description,
      auto_generation_enabled: settings.auto_generation_enabled,
      days_before_season: settings.days_before_season,
      default_invoice_items: settings.default_invoice_items || [],
    });
  }, [settings, form]);

  const watchServiceChargeEnabled = form.watch("service_charge_enabled");
  const watchServiceChargeType = form.watch("service_charge_type");
  const watchServiceChargeValue = form.watch("service_charge_value");
  const watchAutoGenEnabled = form.watch("auto_generation_enabled");

  const calculateServiceChargeExample = () => {
    const subtotal = 100; // Example subtotal
    const value = watchServiceChargeValue || 0;

    if (watchServiceChargeType === "percentage") {
      return (subtotal * value) / 100;
    }
    return value;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleSubmit = async (data: UpdateBillingSettingsRequest) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Service Charge Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Platform Service Charge</CardTitle>
                <CardDescription>
                  {isSuperAdmin
                    ? "Configure automatic service charge applied to all invoices"
                    : "Platform service charge configuration (managed by super admin)"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSuperAdmin && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only super administrators can modify platform service charge settings.
                  Current settings are view-only.
                </AlertDescription>
              </Alert>
            )}

            {/* Enable/Disable Toggle */}
            <FormField
              control={form.control}
              name="service_charge_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Service Charge</FormLabel>
                    <FormDescription>
                      Automatically add service charge to all invoices
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!isSuperAdmin}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Service Charge Configuration */}
            {watchServiceChargeEnabled && (
              <>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Charge Type */}
                  <FormField
                    control={form.control}
                    name="service_charge_type"
                    rules={{ required: "Charge type is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charge Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isSuperAdmin}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Charge Value */}
                  <FormField
                    control={form.control}
                    name="service_charge_value"
                    rules={{
                      required: "Charge value is required",
                      min: { value: 0, message: "Value must be >= 0" },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchServiceChargeType === "percentage"
                            ? "Percentage (%)"
                            : "Fixed Amount ($)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={watchServiceChargeType === "percentage" ? "0.01" : "0.01"}
                            min="0"
                            placeholder={watchServiceChargeType === "percentage" ? "5.00" : "10.00"}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={!isSuperAdmin}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="service_charge_description"
                  rules={{ required: "Description is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Platform Service Fee"
                          {...field}
                          disabled={!isSuperAdmin}
                        />
                      </FormControl>
                      <FormDescription>
                        This description will appear on invoices as a line item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Example Calculation */}
                {watchServiceChargeValue > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Example:</strong> On a {formatCurrency(100)} invoice, the service
                      charge will be{" "}
                      <strong>{formatCurrency(calculateServiceChargeExample())}</strong>
                      {watchServiceChargeType === "percentage" &&
                        ` (${watchServiceChargeValue}%)`}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Auto-Generation Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Automatic Invoice Generation</CardTitle>
                <CardDescription>
                  Configure automatic seasonal invoice generation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable/Disable Toggle */}
            <FormField
              control={form.control}
              name="auto_generation_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Auto-Generation</FormLabel>
                    <FormDescription>
                      Automatically generate invoices before season starts
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Auto-Generation Configuration */}
            {watchAutoGenEnabled && (
              <>
                <Separator />

                {/* Days Before Season */}
                <FormField
                  control={form.control}
                  name="days_before_season"
                  rules={{
                    required: "Days before season is required",
                    min: { value: 0, message: "Must be at least 0 days" },
                    max: { value: 90, message: "Cannot exceed 90 days" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generate Invoices (Days Before Season Start)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="90"
                          placeholder="7"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Invoices will be generated automatically {field.value || 0} days before the
                        season starts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Default Invoice Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Default Invoice Items</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          description: "",
                          category: undefined,
                          quantity: 1,
                          unit_price: 0,
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  <FormDescription>
                    These items will be automatically added to all generated seasonal invoices
                  </FormDescription>

                  <div className="space-y-2">
                    {fields.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Add at least one default item for automatic invoice generation
                        </AlertDescription>
                      </Alert>
                    ) : (
                      fields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg">
                          <div className="flex-1 grid md:grid-cols-4 gap-2">
                            <FormField
                              control={form.control}
                              name={`default_invoice_items.${index}.description`}
                              rules={{ required: "Description is required" }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Description" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`default_invoice_items.${index}.category`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value || "none"}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="none">None</SelectItem>
                                      {(
                                        Object.keys(ITEM_CATEGORY_LABELS) as ItemCategory[]
                                      ).map((category) => (
                                        <SelectItem key={category} value={category}>
                                          {ITEM_CATEGORY_LABELS[category]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`default_invoice_items.${index}.quantity`}
                              rules={{ required: true, min: 1 }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="Qty"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || 1)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`default_invoice_items.${index}.unit_price`}
                              rules={{ required: true, min: 0 }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="Price"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
