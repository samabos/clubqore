import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { BillingSummary } from "@/types/billing";

interface BillingDashboardProps {
  summary: BillingSummary;
  isLoading?: boolean;
}

export function BillingDashboard({ summary, isLoading }: BillingDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const stats = [
    {
      title: "Total Outstanding",
      value: formatCurrency(summary.total_outstanding),
      icon: DollarSign,
      description: `${summary.by_status.pending + summary.by_status.overdue} unpaid invoices`,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Overdue Invoices",
      value: summary.overdue_count.toString(),
      icon: AlertCircle,
      description: formatCurrency(summary.overdue_amount),
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Total Collected",
      value: formatCurrency(summary.total_paid),
      icon: CheckCircle,
      description: `${summary.by_status.paid} paid invoices`,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Invoices",
      value: summary.total_invoices.toString(),
      icon: FileText,
      description: formatCurrency(summary.total_amount),
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
