import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import {
  CreateInvoiceRequest,
  InvoiceType,
  ItemCategory,
  INVOICE_TYPE_LABELS,
  ITEM_CATEGORY_LABELS,
} from "@/types/billing";
import { Season } from "@/types/season";

interface InvoiceFormProps {
  onSubmit: (data: CreateInvoiceRequest) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateInvoiceRequest>;
  seasons?: Season[];
  users?: Array<{ parent_user_id: number; child_user_id: number; first_name: string; last_name: string; email: string }>;
  isLoading?: boolean;
}

export function InvoiceForm({
  onSubmit,
  onCancel,
  initialData,
  seasons = [],
  users = [],
  isLoading,
}: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateInvoiceRequest>({
    defaultValues: {
      user_id: initialData?.user_id || 0,
      season_id: initialData?.season_id || undefined,
      invoice_type: initialData?.invoice_type || "adhoc",
      issue_date: initialData?.issue_date || new Date().toISOString().split("T")[0],
      due_date:
        initialData?.due_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      tax_amount: initialData?.tax_amount || 0,
      discount_amount: initialData?.discount_amount || 0,
      notes: initialData?.notes || "",
      items: initialData?.items || [
        {
          description: "",
          category: undefined,
          quantity: 1,
          unit_price: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const watchTax = form.watch("tax_amount");
  const watchDiscount = form.watch("discount_amount");

  const calculateSubtotal = () => {
    return watchItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const price = item.unit_price || 0;
      return sum + quantity * price;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = watchTax || 0;
    const discount = watchDiscount || 0;
    return subtotal + tax - discount;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleSubmit = async (data: CreateInvoiceRequest) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Failed to submit invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* User Selection */}
              <FormField
                control={form.control}
                name="user_id"
                rules={{ required: "Member is required", min: { value: 1, message: "Please select a member" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.child_user_id} value={user.child_user_id.toString()}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Type */}
              <FormField
                control={form.control}
                name="invoice_type"
                rules={{ required: "Invoice type is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(INVOICE_TYPE_LABELS) as InvoiceType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            {INVOICE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Season (optional) */}
              <FormField
                control={form.control}
                name="season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? undefined : parseInt(value))
                      }
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No season" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No season</SelectItem>
                        {seasons.map((season) => (
                          <SelectItem key={season.id} value={season.id.toString()}>
                            {season.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Issue Date */}
              <FormField
                control={form.control}
                name="issue_date"
                rules={{ required: "Issue date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="due_date"
                rules={{
                  required: "Due date is required",
                  validate: (value) => {
                    const issueDate = form.getValues("issue_date");
                    if (value <= issueDate) {
                      return "Due date must be after issue date";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid md:grid-cols-5 gap-4">
                  {/* Description */}
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      rules={{ required: "Description is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Item description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {(Object.keys(ITEM_CATEGORY_LABELS) as ItemCategory[]).map(
                              (category) => (
                                <SelectItem key={category} value={category}>
                                  {ITEM_CATEGORY_LABELS[category]}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    rules={{ required: "Quantity is required", min: { value: 1, message: "Min 1" } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Unit Price */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.unit_price`}
                    rules={{ required: "Price is required", min: { value: 0, message: "Min 0" } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Remove Button */}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="mt-8"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Additional Charges & Total */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Charges & Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Tax */}
              <FormField
                control={form.control}
                name="tax_amount"
                rules={{ min: { value: 0, message: "Tax must be >= 0" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discount */}
              <FormField
                control={form.control}
                name="discount_amount"
                rules={{ min: { value: 0, message: "Discount must be >= 0" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Totals Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              {watchTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>{formatCurrency(watchTax)}</span>
                </div>
              )}
              {watchDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(watchDiscount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes or instructions"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
