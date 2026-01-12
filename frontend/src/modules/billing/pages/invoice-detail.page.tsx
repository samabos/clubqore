import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvoiceDetail, MarkPaidDialog } from "../components";
import {
  fetchInvoiceById,
  publishInvoice,
  cancelInvoice,
  markInvoiceAsPaid,
} from "../actions/billing-actions";
import type { Invoice, MarkAsPaidRequest } from "@/types/billing";

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    if (!invoiceId) return;

    try {
      setIsLoading(true);
      const data = await fetchInvoiceById(parseInt(invoiceId));
      setInvoice(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load invoice",
        variant: "destructive",
      });
      navigate("/app/billing");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!invoice) return;

    try {
      await publishInvoice(invoice.id);
      toast({
        title: "Success",
        description: "Invoice published successfully",
      });
      loadInvoice();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to publish invoice",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;

    try {
      await cancelInvoice(invoice.id);
      toast({
        title: "Success",
        description: "Invoice cancelled successfully",
      });
      loadInvoice();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invoice",
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async (data: MarkAsPaidRequest) => {
    if (!invoice) return;

    try {
      await markInvoiceAsPaid(invoice.id, data);
      toast({
        title: "Success",
        description: "Invoice marked as paid successfully",
      });
      setShowMarkPaidDialog(false);
      loadInvoice();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark invoice as paid",
        variant: "destructive",
      });
      throw error;
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/billing")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Invoice Details</h1>
          <p className="text-muted-foreground">View and manage invoice</p>
        </div>
      </div>

      {/* Invoice Detail Component */}
      <InvoiceDetail
        invoice={invoice}
        onPublish={handlePublish}
        onCancel={handleCancel}
        onMarkPaid={() => setShowMarkPaidDialog(true)}
      />

      {/* Mark as Paid Dialog */}
      {showMarkPaidDialog && (
        <MarkPaidDialog
          open={showMarkPaidDialog}
          onOpenChange={setShowMarkPaidDialog}
          onConfirm={handleMarkPaid}
          invoiceNumber={invoice.invoice_number}
          totalAmount={invoice.total_amount}
        />
      )}
    </div>
  );
}
