import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ParentInvoiceList } from "@/modules/billing/components/parent-invoice-list";
import { fetchChildInvoices } from "@/modules/billing/actions/billing-actions";
import type { Invoice } from "@/types/billing";
import type { ChildDetailData } from "../types";

interface ChildInvoicesSectionProps {
  child: ChildDetailData;
}

export function ChildInvoicesSection({ child }: ChildInvoicesSectionProps) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [child.childUserId]);

  const loadInvoices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchChildInvoices(Number(child.childUserId));
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    navigate(`/app/parent/billing/${invoice.id}`);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <ParentInvoiceList
      invoices={invoices}
      onView={handleViewInvoice}
      isLoading={isLoading}
    />
  );
}
