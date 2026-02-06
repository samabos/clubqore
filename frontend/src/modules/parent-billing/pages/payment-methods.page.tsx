import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Building2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethodList, MandateSetupFlow } from "../components";
import {
  fetchPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
  initiateMandateSetup,
} from "@/modules/subscription/actions/subscription-actions";
import type { PaymentMethodsResponse } from "@/types/subscription";
import { useAuth } from "@/stores/authStore";

export function PaymentMethodsPage() {
  const { toast } = useToast();
  const { userClub } = useAuth();

  const [data, setData] = useState<PaymentMethodsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await fetchPaymentMethods();
      setData(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load payment methods";
      toast({
        title: "Error",
        description: message,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update default payment method";
      toast({
        title: "Error",
        description: message,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove payment method";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleMandateSetup = async (scheme: "bacs" | "sepa_core" | "ach") => {
    try {
      setIsSettingUp(true);
      // Use the user's club ID
      const clubId = userClub?.id;
      if (!clubId) {
        throw new Error("No club found. Please contact support.");
      }
      const response = await initiateMandateSetup(clubId, "gocardless", scheme);
      // Redirect to authorization URL
      window.location.href = response.authorisationUrl;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to initiate Direct Debit setup";
      toast({
        title: "Error",
        description: message,
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

  const statItems = [
    {
      title: "Total Methods",
      value: String(data.total),
      change: data.hasDefault ? "Default set" : "No default",
      changeType: data.hasDefault ? ("increase" as const) : ("neutral" as const),
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Direct Debits",
      value: String(data.directDebits),
      change: "Bank accounts",
      changeType: "neutral" as const,
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Cards",
      value: String(data.cards),
      change: "Credit/Debit cards",
      changeType: "neutral" as const,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

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

      {/* Stats */}
      {data.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statItems.map((stat, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span
                        className={`text-sm font-medium ${
                          stat.changeType === "increase"
                            ? "text-green-600"
                            : stat.changeType === "decrease"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                      {stat.changeType === "increase" && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
        isLoading={isSettingUp}
      />
    </div>
  );
}
