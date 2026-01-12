import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethodList, MandateSetupFlow } from "../components";
import {
  fetchPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
  initiateMandateSetup,
} from "@/modules/subscription/actions/subscription-actions";
import type { PaymentMethodsResponse } from "@/types/subscription";

// TODO: Fetch actual clubs from the backend
const mockClubs = [
  { id: 1, name: "Football Academy" },
  { id: 2, name: "Tennis Club" },
];

export function PaymentMethodsPage() {
  const { toast } = useToast();

  const [data, setData] = useState<PaymentMethodsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await fetchPaymentMethods();
      setData(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: number) => {
    try {
      await setDefaultPaymentMethod(paymentMethodId);
      toast({
        title: "Success",
        description: "Default payment method updated",
      });
      loadPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update default payment method",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (paymentMethodId: number) => {
    try {
      await removePaymentMethod(paymentMethodId);
      toast({
        title: "Success",
        description: "Payment method removed",
      });
      loadPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method",
        variant: "destructive",
      });
    }
  };

  const handleMandateSetup = async (
    clubId: number,
    scheme: "bacs" | "sepa_core" | "ach"
  ) => {
    try {
      setIsSettingUp(true);
      const response = await initiateMandateSetup(clubId, "gocardless", scheme);
      // Redirect to authorization URL
      window.location.href = response.authorisationUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate Direct Debit setup",
        variant: "destructive",
      });
      setIsSettingUp(false);
      setSetupDialogOpen(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground mt-1">
            Manage your payment methods for subscription payments
          </p>
        </div>
        <Button onClick={() => setSetupDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Direct Debit
        </Button>
      </div>

      {/* Summary */}
      {data.total > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total Methods</p>
            <p className="text-2xl font-bold">{data.total}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Direct Debits</p>
            <p className="text-2xl font-bold">{data.directDebits}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Cards</p>
            <p className="text-2xl font-bold">{data.cards}</p>
          </div>
        </div>
      )}

      {/* Payment Method List */}
      <PaymentMethodList
        data={data}
        onSetDefault={handleSetDefault}
        onRemove={handleRemove}
        isLoading={isLoading}
      />

      {/* Mandate Setup Dialog */}
      <MandateSetupFlow
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        onSetup={handleMandateSetup}
        clubs={mockClubs}
        isLoading={isSettingUp}
      />
    </div>
  );
}
