import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Users, DollarSign } from "lucide-react";
import {
  BulkSeasonalInvoiceRequest,
  ItemCategory,
  ITEM_CATEGORY_LABELS,
} from "@/types/billing";
import { Season } from "@/types/season";

interface BulkInvoiceGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: BulkSeasonalInvoiceRequest) => Promise<void>;
  seasons: Season[];
  users: Array<{ parent_user_id: number; child_user_id: number; first_name: string; last_name: string; email: string }>;
}

export function BulkInvoiceGenerator({
  open,
  onOpenChange,
  onGenerate,
  seasons,
  users,
}: BulkInvoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const form = useForm<BulkSeasonalInvoiceRequest>({
    defaultValues: {
      season_id: 0,
      user_ids: [],
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "",
      items: [
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

  const calculateTotalPerUser = () => {
    return watchItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const price = item.unit_price || 0;
      return sum + quantity * price;
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateTotalPerUser() * selectedUsers.length;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.child_user_id));
    }
  };

  const handleGenerate = async (data: BulkSeasonalInvoiceRequest) => {
    if (selectedUsers.length === 0) {
      form.setError("user_ids", {
        type: "manual",
        message: "Please select at least one member",
      });
      return;
    }

    try {
      setIsGenerating(true);
      await onGenerate({
        ...data,
        user_ids: selectedUsers,
      });
      form.reset();
      setSelectedUsers([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to generate invoices:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setSelectedUsers([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Seasonal Invoices</DialogTitle>
          <DialogDescription>
            Create invoices for multiple members with the same line items
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
            {/* Season Selection */}
            <FormField
              control={form.control}
              name="season_id"
              rules={{ required: "Season is required", min: { value: 1, message: "Please select a season" } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Season</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            {/* Member Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Select Members</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedUsers.length === users.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <Card>
                <CardContent className="p-4 max-h-60 overflow-y-auto space-y-2">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No members found
                    </p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.child_user_id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded"
                      >
                        <Checkbox
                          id={`user-${user.child_user_id}`}
                          checked={selectedUsers.includes(user.child_user_id)}
                          onCheckedChange={() => handleUserToggle(user.child_user_id)}
                        />
                        <label
                          htmlFor={`user-${user.child_user_id}`}
                          className="flex-1 text-sm cursor-pointer"
                        >
                          {user.first_name} {user.last_name}
                          <span className="text-muted-foreground ml-2">({user.email})</span>
                        </label>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              {selectedUsers.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedUsers.length} member{selectedUsers.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
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

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Invoice Items (same for all members)</FormLabel>
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

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="flex-1 grid md:grid-cols-4 gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
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
                        name={`items.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Category" />
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

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        rules={{ required: true, min: 1 }}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
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
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes for all invoices"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            {selectedUsers.length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-medium">Generation Summary</h4>
                  <Separator />
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Members</p>
                        <p className="font-semibold">{selectedUsers.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Per Member</p>
                        <p className="font-semibold">{formatCurrency(calculateTotalPerUser())}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-semibold text-lg">
                          {formatCurrency(calculateGrandTotal())}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating || selectedUsers.length === 0}>
                {isGenerating
                  ? "Generating..."
                  : `Generate ${selectedUsers.length} Invoice${selectedUsers.length !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
