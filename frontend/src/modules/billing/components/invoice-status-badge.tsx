import { Badge } from "@/components/ui/badge";
import { InvoiceStatus, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/types/billing";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const label = INVOICE_STATUS_LABELS[status];
  const colorClass = INVOICE_STATUS_COLORS[status];

  return (
    <Badge variant="outline" className={`${colorClass} ${className || ""}`}>
      {label}
    </Badge>
  );
}
