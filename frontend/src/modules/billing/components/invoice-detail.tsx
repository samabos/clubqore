import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  XCircle,
  CheckCircle,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { InvoiceItemsTable } from "./invoice-items-table";
import { Invoice, INVOICE_TYPE_LABELS } from "@/types/billing";
import { format } from "date-fns";

interface InvoiceDetailProps {
  invoice: Invoice;
  onPublish?: () => void;
  onCancel?: () => void;
  onMarkPaid?: () => void;
}

export function InvoiceDetail({
  invoice,
  onPublish,
  onCancel,
  onMarkPaid,
}: InvoiceDetailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMMM dd, yyyy");
  };

  const canPublish = invoice.status === "draft";
  const canCancel = invoice.status !== "paid" && invoice.status !== "cancelled";
  const canMarkPaid = invoice.status === "pending" || invoice.status === "overdue";

  const isOverdue =
    (invoice.status === "pending" || invoice.status === "overdue") &&
    new Date(invoice.due_date) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">
                  Invoice {invoice.invoice_number}
                </CardTitle>
                <InvoiceStatusBadge status={invoice.status} />
                {isOverdue && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{INVOICE_TYPE_LABELS[invoice.invoice_type]}</span>
                </div>
                {invoice.season_name && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{invoice.season_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canPublish && onPublish && (
                <Button size="sm" onClick={onPublish}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              )}
              {canMarkPaid && onMarkPaid && (
                <Button size="sm" onClick={onMarkPaid}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              )}
              {canCancel && onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Member Info */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Billed To
                </h3>
                <div className="pl-6 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Parent:</p>
                    <p className="font-semibold text-base">
                      {invoice.parent_first_name} {invoice.parent_last_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{invoice.parent_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Child/Member:</p>
                    <p className="font-semibold text-base">
                      {invoice.child_first_name} {invoice.child_last_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{invoice.child_email}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </h3>
                <div className="pl-6 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span className="font-medium">{formatDate(invoice.issue_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium">{formatDate(invoice.due_date)}</span>
                  </div>
                  {invoice.paid_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Paid Date:</span>
                      <span className="font-medium text-green-600">{formatDate(invoice.paid_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Amount Summary */}
            <div>
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Amount Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                  )}
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-{formatCurrency(invoice.discount_amount)}</span>
                    </div>
                  )}
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold text-lg">Total:</span>
                    <span className="font-bold text-2xl">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  {invoice.amount_paid > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Amount Paid:</span>
                        <span className="font-medium">{formatCurrency(invoice.amount_paid)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">Balance Due:</span>
                        <span className="text-destructive">
                          {formatCurrency(invoice.total_amount - invoice.amount_paid)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceItemsTable items={invoice.items || []} />
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment History (future) */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.payment_date)} · {payment.payment_method}
                    </p>
                    {payment.reference_number && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {payment.reference_number}
                      </p>
                    )}
                  </div>
                  {payment.notes && (
                    <p className="text-sm text-muted-foreground italic max-w-md">
                      {payment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
