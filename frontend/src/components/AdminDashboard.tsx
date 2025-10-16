import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";

export function AdminDashboard() {
  const stats = [
    {
      title: "Total Members",
      value: "1,247",
      change: "+12%",
      changeType: "increase",
      icon: Users,
      gradient: "gradient-primary",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Clubs",
      value: "24",
      change: "+3",
      changeType: "increase",
      icon: Building2,
      gradient: "gradient-success",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Monthly Revenue",
      value: "$24,890",
      change: "+8.2%",
      changeType: "increase",
      icon: DollarSign,
      gradient: "gradient-warning",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Events This Month",
      value: "156",
      change: "+23",
      changeType: "increase",
      icon: Calendar,
      gradient: "gradient-danger",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const recentActivity = [
    {
      type: "member",
      title: "New Member Registration",
      message: "John Smith joined Manchester United Youth",
      time: "2 minutes ago",
      status: "success",
      avatar: "JS",
    },
    {
      type: "payment",
      title: "Payment Received",
      message: "Payment of $89 received from Liverpool FC",
      time: "1 hour ago",
      status: "success",
      avatar: "LF",
    },
    {
      type: "event",
      title: "Event Scheduled",
      message: "Training session scheduled for Chelsea Youth",
      time: "3 hours ago",
      status: "info",
      avatar: "CF",
    },
    {
      type: "alert",
      title: "Attendance Alert",
      message: "Low attendance alert for Arsenal Academy",
      time: "5 hours ago",
      status: "warning",
      avatar: "AA",
    },
  ];

  const upcomingEvents = [
    {
      title: "Manchester United vs Chelsea",
      date: "Today",
      time: "3:00 PM",
      type: "Match",
      location: "Old Trafford",
      status: "confirmed",
      attendees: 22,
    },
    {
      title: "Liverpool FC Training",
      date: "Tomorrow",
      time: "10:00 AM",
      type: "Training",
      location: "Anfield Training Ground",
      status: "confirmed",
      attendees: 18,
    },
    {
      title: "Arsenal Youth Tournament",
      date: "Dec 25",
      time: "2:00 PM",
      type: "Tournament",
      location: "Emirates Stadium",
      status: "pending",
      attendees: 32,
    },
  ];

  const quickStats = [
    { label: "Active Sessions", value: "12", color: "text-blue-600" },
    { label: "Pending Payments", value: "8", color: "text-orange-600" },
    { label: "New Messages", value: "24", color: "text-green-600" },
    { label: "Upcoming Events", value: "156", color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div
              className={`absolute top-0 right-0 w-20 h-20 ${stat.gradient} opacity-10 rounded-bl-full`}
            ></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-2">
                    {stat.changeType === "increase" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.changeType === "increase"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Recent Activity */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Latest updates from your football clubs
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-white">
                    {activity.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`${
                        activity.status === "success"
                          ? "bg-green-100 text-green-800"
                          : activity.status === "warning"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Enhanced Upcoming Events */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Upcoming Events
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <ArrowUpRight className="w-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-gray-600">
              Next matches and training sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge
                    variant="secondary"
                    className={`${
                      event.type === "Match"
                        ? "bg-red-100 text-red-800"
                        : event.type === "Training"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {event.type}
                  </Badge>
                  <Badge
                    variant={
                      event.status === "confirmed" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {event.status}
                  </Badge>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {event.title}
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {event.date} at {event.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>{event.attendees} attendees</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-gray-600">
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                label: "Add Member",
                gradient: "gradient-primary",
              },
              {
                icon: Building2,
                label: "Register Club",
                gradient: "gradient-success",
              },
              {
                icon: Calendar,
                label: "Schedule Event",
                gradient: "gradient-warning",
              },
              {
                icon: DollarSign,
                label: "Generate Invoice",
                gradient: "gradient-danger",
              },
            ].map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-6 flex flex-col gap-3 border-2 hover:border-primary hover:shadow-lg transition-all duration-300"
              >
                <div className={`p-3 ${action.gradient} rounded-xl shadow-lg`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium text-gray-900">
                  {action.label}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Performance Overview
          </CardTitle>
          <CardDescription className="text-gray-600">
            Club performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Member Engagement
                </span>
                <span className="text-sm font-bold text-gray-900">87%</span>
              </div>
              <Progress value={87} className="h-3" />
              <p className="text-xs text-gray-500">+5% from last month</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Event Attendance
                </span>
                <span className="text-sm font-bold text-gray-900">92%</span>
              </div>
              <Progress value={92} className="h-3" />
              <p className="text-xs text-gray-500">+3% from last month</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Payment Collection
                </span>
                <span className="text-sm font-bold text-gray-900">96%</span>
              </div>
              <Progress value={96} className="h-3" />
              <p className="text-xs text-gray-500">+2% from last month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
