import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Bell,
  ArrowUpRight,
  MessageSquare,
  Baby,
  Star,
  MapPin,
  CreditCard,
} from "lucide-react";

export function ParentDashboard() {
  const parentStats = [
    {
      title: "Children",
      value: "2",
      change: "Both active",
      changeType: "neutral",
      icon: Baby,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "This Month's Fees",
      value: "$178",
      change: "2 pending",
      changeType: "warning",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Upcoming Events",
      value: "5",
      change: "This week",
      changeType: "neutral",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Attendance Rate",
      value: "94%",
      change: "Above average",
      changeType: "increase",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const children = [
    {
      id: 1,
      name: "Emma Smith",
      age: 12,
      club: "Manchester United Youth",
      position: "Midfielder",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      attendanceRate: 96,
      upcomingEvents: 3,
      lastActivity: "Training Session",
      lastActivityDate: "Yesterday",
      performance: 4.5,
      membershipStatus: "Active",
    },
    {
      id: 2,
      name: "James Smith",
      age: 10,
      club: "Manchester United Youth",
      position: "Forward",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      attendanceRate: 92,
      upcomingEvents: 2,
      lastActivity: "Match vs Arsenal",
      lastActivityDate: "2 days ago",
      performance: 4.2,
      membershipStatus: "Active",
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Emma's Training Session",
      time: "4:00 PM - 6:00 PM",
      date: "Today",
      location: "Main Field",
      type: "training",
      child: "Emma Smith",
    },
    {
      id: 2,
      title: "James' Match vs Chelsea",
      time: "10:00 AM - 12:00 PM",
      date: "Saturday",
      location: "Away Ground",
      type: "match",
      child: "James Smith",
    },
    {
      id: 3,
      title: "Parent-Coach Meeting",
      time: "7:00 PM - 8:00 PM",
      date: "Monday",
      location: "Club House",
      type: "meeting",
      child: "Both Children",
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

  const paymentSummary = [
    {
      child: "Emma Smith",
      amount: 89,
      dueDate: "Jan 25, 2024",
      status: "due",
      description: "Monthly Membership",
    },
    {
      child: "James Smith",
      amount: 89,
      dueDate: "Jan 25, 2024",
      status: "due",
      description: "Monthly Membership",
    },
    {
      child: "Emma Smith",
      amount: 45,
      dueDate: "Paid",
      status: "paid",
      description: "Equipment Fee",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, Jane!
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
          <Button className="rounded-xl gradient-primary text-white hover:opacity-90">
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
                        stat.changeType === "increase"
                          ? "text-green-600"
                          : stat.changeType === "warning"
                          ? "text-yellow-600"
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
          <CardContent className="space-y-4">
            {children.map((child) => (
              <div key={child.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 rounded-xl">
                      <AvatarImage
                        src={child.avatar}
                        className="rounded-xl object-cover"
                      />
                      <AvatarFallback className="rounded-xl bg-primary text-white">
                        {child.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{child.name}</p>
                      <p className="text-sm text-gray-600">
                        {child.age} years • {child.position}
                      </p>
                      <p className="text-sm text-blue-600">{child.club}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        child.membershipStatus === "Active"
                          ? "default"
                          : "secondary"
                      }
                      className="rounded-lg mb-2"
                    >
                      {child.membershipStatus}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {child.performance}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Attendance
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={child.attendanceRate}
                        className="h-2 flex-1"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {child.attendanceRate}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Upcoming Events
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {child.upcomingEvents}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Last Activity
                    </p>
                    <p className="text-sm text-gray-900">
                      {child.lastActivity}
                    </p>
                    <p className="text-xs text-gray-500">
                      {child.lastActivityDate}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg flex-1"
                  >
                    View Progress
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg flex-1"
                  >
                    Contact Coach
                  </Button>
                </div>
              </div>
            ))}
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
            >
              <Calendar className="w-4 h-4 mr-2" />
              Full Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.time}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={event.type === "match" ? "default" : "outline"}
                      className="rounded-lg"
                    >
                      {event.date}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`rounded-lg ${
                        event.type === "match"
                          ? "bg-green-100 text-green-700"
                          : event.type === "training"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {event.type}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {event.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Baby className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {event.child}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Payment Summary
              </CardTitle>
              <CardDescription className="text-gray-600">
                Recent payments and upcoming dues
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-gray-200 hover:border-gray-300"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Payments
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentSummary.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{payment.child}</p>
                  <p className="text-sm text-gray-600">{payment.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${payment.amount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        payment.status === "paid" ? "default" : "destructive"
                      }
                      className="rounded-lg text-xs"
                    >
                      {payment.status === "paid" ? "Paid" : "Due"}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {payment.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
