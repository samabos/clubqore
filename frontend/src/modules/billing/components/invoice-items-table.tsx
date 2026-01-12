import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvoiceItem, ITEM_CATEGORY_LABELS } from "@/types/billing";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  showCategory?: boolean;
  className?: string;
}

export function InvoiceItemsTable({
  items,
  showCategory = true,
  className
}: InvoiceItemsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            {showCategory && <TableHead>Category</TableHead>}
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showCategory ? 5 : 4}
                className="text-center text-muted-foreground py-8"
              >
                No items
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.description}</TableCell>
                {showCategory && (
                  <TableCell>
                    {item.category ? (
                      <Badge variant="secondary" className="text-xs">
                        {ITEM_CATEGORY_LABELS[item.category]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.total_price)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {items.length > 0 && (
        <div className="flex justify-end mt-4 pr-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Subtotal</div>
            <div className="text-lg font-semibold">{formatCurrency(calculateSubtotal())}</div>
          </div>
        </div>
      )}
    </div>
  );
}
