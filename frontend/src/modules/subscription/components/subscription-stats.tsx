import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, PauseCircle, AlertCircle } from "lucide-react";
import type { SubscriptionStats as SubscriptionStatsType } from "@/types/subscription";

interface SubscriptionStatsProps {
  stats: SubscriptionStatsType;
}

export function SubscriptionStats({ stats }: SubscriptionStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const statItems = [
    {
      title: "Active Subscriptions",
      value: String(stats.activeSubscriptions),
      change: `${stats.totalSubscriptions} total`,
      changeType: "neutral" as const,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRecurringRevenue),
      change: "MRR from active",
      changeType: "increase" as const,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Paused",
      value: String(stats.pausedSubscriptions),
      change: "Temporarily paused",
      changeType: "neutral" as const,
      icon: PauseCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Suspended",
      value: String(stats.suspendedSubscriptions),
      change: "Payment failures",
      changeType: stats.suspendedSubscriptions > 0 ? "decrease" as const : "neutral" as const,
      icon: AlertCircle,
      color: stats.suspendedSubscriptions > 0 ? "text-red-600" : "text-orange-600",
      bgColor: stats.suspendedSubscriptions > 0 ? "bg-red-50" : "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
  );
}
