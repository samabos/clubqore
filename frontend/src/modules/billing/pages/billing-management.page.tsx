import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  BillingDashboard,
  BillingFilters,
  InvoiceList,
  InvoiceForm,
  BulkInvoiceGenerator,
  MarkPaidDialog,
} from "../components";
import {
  fetchInvoices,
  fetchBillingSummary,
  createInvoice,
  publishInvoice,
  cancelInvoice,
  markInvoiceAsPaid,
  generateSeasonalInvoices,
} from "../actions/billing-actions";
import { fetchSeasons } from "@/modules/season/actions/season-actions";
import { fetchClubMembers } from "@/modules/member/actions/member-actions";
import type {
  Invoice,
  InvoiceFilters,
  BillingSummary,
  CreateInvoiceRequest,
  BulkSeasonalInvoiceRequest,
  MarkAsPaidRequest,
} from "@/types/billing";
import type { Season } from "@/types/season";

interface BillingUser {
  parent_user_id: number;
  child_user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export function BillingManagementPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [users, setUsers] = useState<BillingUser[]>([]);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isBulkGenOpen, setIsBulkGenOpen] = useState(false);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
    loadSeasons();
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invoicesData, summaryData] = await Promise.all([
        fetchInvoices(filters),
        fetchBillingSummary(filters),
      ]);
      setInvoices(invoicesData);
      setSummary(summaryData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load billing data";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSeasons = async () => {
    try {
      const seasonsData = await fetchSeasons();
      setSeasons(seasonsData);
    } catch (error) {
      console.error("Failed to load seasons:", error);
    }
  };

  const loadMembers = async () => {
    try {
      const membersData = await fetchClubMembers();

      // Filter only parents and format as "Parent Name (Child Name)"
      const transformedUsers = membersData
        .filter((member) => member.membershipType === 'parent' && member.hasChildren)
        .flatMap((parent) => {
          // For each parent, create entries for each child
          return parent.children.map((child) => {
            // Split parent name into first_name and last_name
            const nameParts = parent.name.split(' ');
            const parentFirstName = nameParts[0] || '';
            const parentLastName = nameParts.slice(1).join(' ') || '';

            return {
              parent_user_id: parent.id,
              child_user_id: child.id,
              first_name: `${parentFirstName} ${parentLastName}`,
              last_name: `(${child.name})`, // Child name in parentheses
              email: parent.email,
            };
          });
        });

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Failed to load members:", error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = async (data: CreateInvoiceRequest) => {
    try {
      await createInvoice(data);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setIsCreateFormOpen(false);
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create invoice";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleBulkGenerate = async (data: BulkSeasonalInvoiceRequest) => {
    try {
      const result = await generateSeasonalInvoices(data);
      toast({
        title: "Success",
        description: `Generated ${result.count} invoices successfully`,
      });
      setIsBulkGenOpen(false);
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate invoices";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePublish = async (invoice: Invoice) => {
    try {
      await publishInvoice(invoice.id);
      toast({
        title: "Success",
        description: `Invoice ${invoice.invoice_number} published`,
      });
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to publish invoice";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (invoice: Invoice) => {
    try {
      await cancelInvoice(invoice.id);
      toast({
        title: "Success",
        description: `Invoice ${invoice.invoice_number} cancelled`,
      });
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to cancel invoice";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async (data: MarkAsPaidRequest) => {
    if (!markPaidInvoice) return;

    try {
      await markInvoiceAsPaid(markPaidInvoice.id, data);
      toast({
        title: "Success",
        description: `Invoice ${markPaidInvoice.invoice_number} marked as paid`,
      });
      setMarkPaidInvoice(null);
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to mark invoice as paid";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    navigate(`/app/billing/${invoice.id}`);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage invoices and billing for all members
          </p>
        </div>
        <div className="flex items-center gap-2">
         {/* <Button variant="outline" onClick={() => setIsBulkGenOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Generate Seasonal Invoices
          </Button>
          <Button onClick={() => setIsCreateFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
          */}
        </div>
      </div>

      {/* Summary Dashboard */}
      {summary && <BillingDashboard summary={summary} isLoading={isLoading} />}

      {/* Filters */}
      <BillingFilters
        filters={filters}
        onFiltersChange={setFilters}
        seasons={seasons}
        showSeasonFilter={true}
      />

      {/* Invoice List */}
      <InvoiceList
        invoices={invoices}
        onView={handleViewInvoice}
        onPublish={handlePublish}
        onCancel={handleCancel}
        onMarkPaid={setMarkPaidInvoice}
        isLoading={isLoading}
      />

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="!max-w-[65vw] w-[65vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create an adhoc or seasonal invoice for a member
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            onSubmit={handleCreateInvoice}
            onCancel={() => setIsCreateFormOpen(false)}
            seasons={seasons}
            users={users}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Invoice Generator */}
      <BulkInvoiceGenerator
        open={isBulkGenOpen}
        onOpenChange={setIsBulkGenOpen}
        onGenerate={handleBulkGenerate}
        seasons={seasons}
        users={users}
      />

      {/* Mark as Paid Dialog */}
      {markPaidInvoice && (
        <MarkPaidDialog
          open={!!markPaidInvoice}
          onOpenChange={(open) => !open && setMarkPaidInvoice(null)}
          onConfirm={handleMarkPaid}
          invoiceNumber={markPaidInvoice.invoice_number}
          totalAmount={markPaidInvoice.total_amount}
        />
      )}
    </div>
  );
}
