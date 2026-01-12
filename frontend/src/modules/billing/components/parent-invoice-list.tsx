import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, User, Calendar } from "lucide-react";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { Invoice, INVOICE_TYPE_LABELS } from "@/types/billing";
import { format } from "date-fns";

interface ParentInvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  isLoading?: boolean;
}

export function ParentInvoiceList({
  invoices,
  onView,
  isLoading,
}: ParentInvoiceListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === "paid" || invoice.status === "cancelled") return false;
    return new Date(invoice.due_date) < new Date();
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {invoices.map((invoice) => (
        <Card
          key={invoice.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onView(invoice)}
        >
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                  <div className="flex items-center gap-2">
                    <InvoiceStatusBadge status={invoice.status} />
                    {isOverdue(invoice) && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {INVOICE_TYPE_LABELS[invoice.invoice_type]}
                </Badge>
              </div>

              {/* Member Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    Child: {invoice.child_first_name} {invoice.child_last_name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  Parent: {invoice.parent_first_name} {invoice.parent_last_name}
                </div>
              </div>

              {/* Season Info */}
              {invoice.season_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{invoice.season_name}</span>
                </div>
              )}

              {/* Amount */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className={isOverdue(invoice) ? "text-destructive font-medium" : ""}>
                  {formatDate(invoice.due_date)}
                </span>
              </div>

              {/* Actions */}
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(invoice);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
