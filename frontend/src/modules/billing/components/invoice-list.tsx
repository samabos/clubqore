import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Eye,
  Send,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { Invoice, INVOICE_TYPE_LABELS } from "@/types/billing";
import { format } from "date-fns";

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onPublish?: (invoice: Invoice) => void;
  onCancel?: (invoice: Invoice) => void;
  onMarkPaid?: (invoice: Invoice) => void;
  isLoading?: boolean;
}

export function InvoiceList({
  invoices,
  onView,
  onPublish,
  onCancel,
  onMarkPaid,
  isLoading,
}: InvoiceListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  const canPublish = (invoice: Invoice) => invoice.status === "draft";
  const canCancel = (invoice: Invoice) =>
    invoice.status !== "paid" && invoice.status !== "cancelled";
  const canMarkPaid = (invoice: Invoice) =>
    invoice.status === "pending" || invoice.status === "overdue";

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === "paid" || invoice.status === "cancelled") return false;
    return new Date(invoice.due_date) < new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Child / Parent</TableHead>
            <TableHead>Season</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(invoice)}
            >
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="font-medium">
                    {invoice.child_first_name} {invoice.child_last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Parent: {invoice.parent_first_name} {invoice.parent_last_name}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {invoice.season_name ? (
                  <Badge variant="outline" className="text-xs">
                    {invoice.season_name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {INVOICE_TYPE_LABELS[invoice.invoice_type]}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(invoice.issue_date)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {formatDate(invoice.due_date)}
                  {isOverdue(invoice) && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(invoice.total_amount)}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(invoice)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>

                    {canPublish(invoice) && onPublish && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onPublish(invoice)}>
                          <Send className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      </>
                    )}

                    {canMarkPaid(invoice) && onMarkPaid && (
                      <DropdownMenuItem onClick={() => onMarkPaid(invoice)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Paid
                      </DropdownMenuItem>
                    )}

                    {canCancel(invoice) && onCancel && (
                      <DropdownMenuItem
                        onClick={() => onCancel(invoice)}
                        className="text-orange-600"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Invoice
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
