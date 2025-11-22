import { Card, CardContent } from "../../../components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { ClubMember } from "../../member/types/component-types";
import {
  ArrowUpRight,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { StatItem } from "../types/component-types";

interface StatsGridProps {
  members?: ClubMember[];
}

export function StatsGrid({ members }: StatsGridProps) {
  const [totalActivePlayers, setTotalActivePlayers] = useState<number>(0);
  const [totalInactivePlayers, setTotalInactivePlayers] = useState<number>(0);

  useEffect(() => {
    const source = members || [];
    const activePlayers = source.filter(
      (m) => m.membershipType === "member" && m.status === "Active"
    );
    const inactivePlayers = source.filter(
      (m) => m.membershipType === "member" && m.status === "Inactive"
    );
    setTotalActivePlayers(activePlayers.length);
    setTotalInactivePlayers(inactivePlayers.length);
  }, [members]);

  const clubStats: StatItem[] = useMemo(() => {
    const total = totalActivePlayers + totalInactivePlayers;
    const activePct = total
      ? Math.round((totalActivePlayers / total) * 100)
      : 0;
    const changeLabel = `${activePct}% active`;
    const changeType: "increase" | "decrease" | "neutral" =
      activePct > 50 ? "increase" : activePct < 50 ? "decrease" : "neutral";
    return [
      {
        title: "Total Members",
        value: String(totalActivePlayers),
        change: changeLabel,
        changeType,
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "Monthly Revenue",
        value: "$13,890",
        change: "+8.2%",
        changeType: "increase",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "This Week's Sessions",
        value: "24",
        change: "6 upcoming",
        changeType: "neutral",
        icon: Calendar,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "Attendance Rate",
        value: "92%",
        change: "+3.1%",
        changeType: "increase",
        icon: TrendingUp,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ];
  }, [totalActivePlayers, totalInactivePlayers]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {clubStats.map((stat, index) => (
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
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
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
  );
}
