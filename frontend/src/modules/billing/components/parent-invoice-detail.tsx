import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, User, FileText, CreditCard, Info } from "lucide-react";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { InvoiceItemsTable } from "./invoice-items-table";
import { Invoice, INVOICE_TYPE_LABELS } from "@/types/billing";
import { format } from "date-fns";

interface ParentInvoiceDetailProps {
  invoice: Invoice;
}

export function ParentInvoiceDetail({ invoice }: ParentInvoiceDetailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMMM dd, yyyy");
  };

  const isOverdue =
    (invoice.status === "pending" || invoice.status === "overdue") &&
    new Date(invoice.due_date) < new Date();

  const canPayOnline = invoice.status === "pending" || invoice.status === "overdue";

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
                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
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

            {/* Payment Button (Coming Soon) */}
            {canPayOnline && (
              <Button disabled>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Online
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Member Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <User className="h-4 w-4" />
                Billed To
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Parent:</p>
                  <p className="font-medium">
                    {invoice.parent_first_name} {invoice.parent_last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{invoice.parent_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Child/Member:</p>
                  <p className="font-medium">
                    {invoice.child_first_name} {invoice.child_last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{invoice.child_email}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Dates</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className={isOverdue ? "font-medium text-destructive" : "font-medium"}>
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
                {invoice.paid_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Date:</span>
                    <span className="font-medium">{formatDate(invoice.paid_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Summary */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Coming Soon Notice */}
      {canPayOnline && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Online Payment Coming Soon!</strong>
            <p className="mt-1">
              We're working on integrating online payment functionality. For now, please contact the
              club manager for payment instructions.
            </p>
          </AlertDescription>
        </Alert>
      )}

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

      {/* Payment History */}
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
