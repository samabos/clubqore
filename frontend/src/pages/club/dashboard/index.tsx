import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { Progress } from "../../../components/ui/progress";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Bell,
  Plus,
  ArrowUpRight,
  MessageSquare,
  Activity,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../../store";

export function ClubManagerDashboard() {
  const navigate = useNavigate();
  const { userClub, clubDataLoaded } = useAppStore();

  // Debug club status
  console.log(
    "🏟️ Club Dashboard - userClub:",
    userClub,
    "clubDataLoaded:",
    clubDataLoaded
  );

  // Check if user has a club setup (only after data is loaded)
  const hasClubSetup = clubDataLoaded && userClub !== null;

  // Show loading state while club data is being loaded
  if (!clubDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  const clubStats = [
    {
      title: "Total Members",
      value: "156",
      change: "+12",
      changeType: "increase",
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

  const recentMembers = [
    {
      id: 1,
      name: "Alex Thompson",
      email: "alex.thompson@email.com",
      joinedDate: "2024-01-15",
      status: "Active",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 2,
      name: "Emma Rodriguez",
      email: "emma.rodriguez@email.com",
      joinedDate: "2024-01-12",
      status: "Active",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "michael.chen@email.com",
      joinedDate: "2024-01-10",
      status: "Pending",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
  ];

  const upcomingSessions = [
    {
      id: 1,
      title: "Youth Training Session",
      time: "10:00 AM - 12:00 PM",
      date: "Today",
      participants: 18,
      coach: "Sarah Johnson",
    },
    {
      id: 2,
      title: "Advanced Skills Workshop",
      time: "2:00 PM - 4:00 PM",
      date: "Today",
      participants: 12,
      coach: "Mike Roberts",
    },
    {
      id: 3,
      title: "Match Preparation",
      time: "9:00 AM - 11:00 AM",
      date: "Tomorrow",
      participants: 22,
      coach: "David Wilson",
    },
  ];

  const alerts = [
    {
      id: 1,
      type: "warning",
      title: "Payment Overdue",
      message: "3 members have overdue payments",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "info",
      title: "Session Reminder",
      message: "Youth training starts in 30 minutes",
      time: "30 minutes ago",
    },
    {
      id: 3,
      type: "success",
      title: "New Registration",
      message: "Alex Thompson completed registration",
      time: "1 hour ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Club Setup Banner - Show if no club is set up */}
      {!hasClubSetup && (
        <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Set Up Your Club
                  </h3>
                  <p className="text-gray-600">
                    Complete your club profile to start managing members and
                    activities
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/app/club/setup")}
                className="rounded-xl gradient-primary text-white hover:opacity-90"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Set Up Club
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, Manchester United Youth
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your club today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-gray-200 hover:border-gray-300"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </Button>
          <Button className="rounded-xl gradient-primary text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
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
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Members */}
        <Card className="border-0 shadow-lg rounded-xl lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Recent Members
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Latest member registrations
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 rounded-xl">
                    <AvatarImage
                      src={member.avatar}
                      className="rounded-xl object-cover"
                    />
                    <AvatarFallback className="rounded-xl bg-primary text-white">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      member.status === "Active" ? "default" : "secondary"
                    }
                    className="rounded-lg mb-1"
                  >
                    {member.status}
                  </Badge>
                  <p className="text-xs text-gray-500">{member.joinedDate}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === "warning"
                        ? "bg-yellow-500"
                        : alert.type === "success"
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {alert.title}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Upcoming Sessions
              </CardTitle>
              <CardDescription className="text-gray-600">
                Training sessions and activities
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-gray-200 hover:border-gray-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {session.title}
                    </h4>
                    <p className="text-sm text-gray-600">{session.time}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="rounded-lg">
                      {session.date}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      {session.participants}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Coach:</span>{" "}
                      {session.coach}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Monthly Goals
            </CardTitle>
            <CardDescription className="text-gray-600">
              Track your club's progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Member Growth
                </p>
                <p className="text-sm text-gray-600">78/100</p>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Revenue Target
                </p>
                <p className="text-sm text-gray-600">$13,890/$15,000</p>
              </div>
              <Progress value={92.6} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Session Attendance
                </p>
                <p className="text-sm text-gray-600">92%</p>
              </div>
              <Progress value={92} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
            >
              <Plus className="w-4 h-4 mr-3" />
              Add New Member
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
            >
              <Calendar className="w-4 h-4 mr-3" />
              Schedule Session
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
            >
              <DollarSign className="w-4 h-4 mr-3" />
              Process Payments
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              Send Announcement
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-gray-200 hover:border-gray-300"
            >
              <Activity className="w-4 h-4 mr-3" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
