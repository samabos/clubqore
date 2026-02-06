import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Bell,
  MessageSquare,
  Baby,
  CreditCard,
} from "lucide-react";
import type { Invoice } from "@/types/billing";
import { format, parseISO } from "date-fns";
import { ScheduleCard } from "@/modules/schedule/components/schedule-card";
import { parentEventToScheduleItem } from "@/modules/schedule/utils/schedule-utils";
import { fetchParentDashboardData } from "../actions/parent-dashboard-actions";
import { combineAndSortEvents, getInvoiceStatusVariant } from "../utils/dashboard-utils";
import type { DashboardEvent } from "../types";
import { fetchParentChildren } from "@/modules/parent/actions";
import type { EnrichedChild } from "@/modules/parent/types";
import { useAuthStore } from "@/stores/authStore";

export function ParentDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [children, setChildren] = useState<EnrichedChild[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch enriched children data (with teams)
        const [enrichedChildren, dashboardData] = await Promise.all([
          fetchParentChildren(),
          fetchParentDashboardData()
        ]);

        setChildren(enrichedChildren);
        setInvoices(dashboardData.invoices);

        // Combine and sort events
        const events = combineAndSortEvents(dashboardData.trainingSessions, dashboardData.matches);
        // Filter out draft events - parents can see scheduled, in_progress, completed, and cancelled events
        const visibleEvents = events.filter(event => {
          const scheduleItem = parentEventToScheduleItem(event);
          return scheduleItem.status !== 'draft';
        });
        setUpcomingEvents(visibleEvents);
      } catch (err: unknown) {
        console.error('Dashboard load error:', err);
        const message = err instanceof Error ? err.message : "Failed to load dashboard data. Please try refreshing the page.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate stats from real data
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "overdue"
  );
  const totalPendingFees = pendingInvoices.reduce(
    (sum, inv) => sum + (Number(inv.total_amount) || 0),
    0
  );

  const parentStats = [
    {
      title: "Children",
      value: children.length.toString(),
      change: children.length > 0 ? "Active" : "None added",
      changeType: "neutral" as const,
      icon: Baby,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Fees",
      value: `$${totalPendingFees.toFixed(2)}`,
      change: `${pendingInvoices.length} pending`,
      changeType: pendingInvoices.length > 0 ? ("warning" as const) : ("neutral" as const),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Upcoming Events",
      value: upcomingEvents.length.toString(),
      change: upcomingEvents.length > 0
        ? `Next: ${format(parseISO(upcomingEvents[0].date), 'MMM d')}`
        : "None scheduled",
      changeType: "neutral" as const,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Attendance Rate",
      value: "-",
      change: "Coming soon",
      changeType: "neutral" as const,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const notifications = [
    {
      id: 1,
      type: "payment",
      title: "Payment Due",
      message: "Emma's monthly fee is due in 3 days",
      time: "2 hours ago",
      urgent: true,
    },
    {
      id: 2,
      type: "schedule",
      title: "Schedule Change",
      message: "James' training moved to 5:00 PM tomorrow",
      time: "4 hours ago",
      urgent: false,
    },
    {
      id: 3,
      type: "achievement",
      title: "Achievement Unlocked",
      message: "Emma scored 2 goals in yesterday's match!",
      time: "1 day ago",
      urgent: false,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.profile?.firstName || user?.email?.split('@')[0] || 'Parent'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your children's football activities.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-gray-200 hover:border-gray-300"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </Button>
          <Button className="rounded-xl gradient-primary text-white hover:opacity-90"
              onClick={() => navigate('/app/parent/schedule')}>
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {parentStats.map((stat, index) => (
          <Card
            key={index}
            className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow"
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span
                      className={`text-sm font-medium ${
                        stat.changeType === "warning"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon
                    className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Children Overview */}
        <Card className="border-0 shadow-lg rounded-xl lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  My Children
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Activity overview for your children
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.length > 0 ? (
              children.map((child) => {
                const calculateAge = (dateOfBirth: string) => {
                  const today = new Date();
                  const birthDate = new Date(dateOfBirth);
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  return age;
                };

                return (
                  <div key={child.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate(`/app/parent/children/${child.id}`)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {child.firstName[0]}
                          {child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {child.firstName} {child.lastName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">
                            {calculateAge(child.dateOfBirth)} years
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {child.clubName || "Not enrolled"}
                          </span>
                          {child.teams && child.teams.length > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <div className="flex flex-wrap gap-1">
                                {child.teams.slice(0, 2).map((team) => (
                                  <Badge key={team.id} variant="secondary" className="text-xs">
                                    {team.name}
                                  </Badge>
                                ))}
                                {child.teams.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{child.teams.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p className="mb-2">No children added yet</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/app/profile")}>
                  Add children in your profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-xl ${
                  notification.urgent
                    ? "bg-red-50 border border-red-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === "payment"
                        ? "bg-red-500"
                        : notification.type === "schedule"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full rounded-xl border-gray-200 hover:border-gray-300 mt-4"
            >
              View All Notifications
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Upcoming Events
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your children's schedule for the next few days
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-gray-200 hover:border-gray-300"
              onClick={() => navigate('/app/parent/schedule')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Full Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <ScheduleCard
                  key={`${event.type}-${event.id}`}
                  item={parentEventToScheduleItem(event)}
                  readOnly={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No upcoming events</p>
              <p className="text-sm mt-2">
                Events will appear here when your children are enrolled in teams
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Recent Invoices
              </CardTitle>
              <CardDescription className="text-gray-600">
                Latest invoices for your children
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-gray-200 hover:border-gray-300"
              onClick={() => navigate("/app/parent/billing")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/parent/billing/${invoice.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      Child: {invoice.child_first_name} {invoice.child_last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Parent: {invoice.parent_first_name} {invoice.parent_last_name}
                      {invoice.season_name && ` • ${invoice.season_name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${Number(invoice.total_amount).toFixed(2)}
                    </p>
                    <Badge
                      variant={getInvoiceStatusVariant(invoice.status)}
                      className="rounded-lg text-xs mt-1"
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {invoices.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full rounded-lg border-gray-200 hover:border-gray-300 mt-2"
                  onClick={() => navigate("/app/parent/billing")}
                >
                  View All Invoices ({invoices.length})
                </Button>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No invoices yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
