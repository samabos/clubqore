import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, Building2, Star, Trash2 } from "lucide-react";
import type { PaymentMethod, PaymentMethodsResponse } from "@/types/subscription";
import {
  MANDATE_STATUS_LABELS,
  MANDATE_STATUS_COLORS,
} from "@/types/subscription";

interface PaymentMethodListProps {
  data: PaymentMethodsResponse;
  onSetDefault: (paymentMethodId: number) => Promise<void>;
  onRemove: (paymentMethodId: number) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentMethodList({
  data,
  onSetDefault,
  onRemove,
  isLoading = false,
}: PaymentMethodListProps) {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [methodToRemove, setMethodToRemove] = useState<PaymentMethod | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = (method: PaymentMethod) => {
    setMethodToRemove(method);
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (methodToRemove) {
      setIsRemoving(true);
      try {
        await onRemove(methodToRemove.id);
      } finally {
        setIsRemoving(false);
        setRemoveDialogOpen(false);
        setMethodToRemove(null);
      }
    }
  };

  const getMethodIcon = (type: string) => {
    if (type === "card") {
      return <CreditCard className="h-5 w-5" />;
    }
    return <Building2 className="h-5 w-5" />;
  };

  const getMethodDisplay = (method: PaymentMethod) => {
    if (method.type === "card") {
      return {
        title: `${method.card_brand || "Card"} ending in ${method.card_last4}`,
        subtitle: `Expires ${method.card_exp_month}/${method.card_exp_year}`,
      };
    }
    return {
      title: "Direct Debit",
      subtitle: method.mandate_reference
        ? `Reference: ${method.mandate_reference}`
        : method.mandate_scheme?.toUpperCase() || "Bank Account",
    };
  };

  if (data.methods.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No payment methods set up yet.
            <br />
            Set up Direct Debit to enable automatic payments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {data.methods.map((method) => {
          const display = getMethodDisplay(method);
          return (
            <Card key={method.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {getMethodIcon(method.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{display.title}</CardTitle>
                        {method.is_default && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{display.subtitle}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.mandate_status && (
                      <Badge
                        variant="secondary"
                        className={MANDATE_STATUS_COLORS[method.mandate_status]}
                      >
                        {MANDATE_STATUS_LABELS[method.mandate_status]}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  {!method.is_default && method.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetDefault(method.id)}
                      disabled={isLoading}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveClick(method)}
                    disabled={isLoading || method.is_default}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? Any active
              subscriptions using this method will need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
