import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  Trophy,
  Users,
  MessageSquare,
  Bell,
  Target,
  Activity,
  CreditCard,
  MapPin,
  Star
} from "lucide-react";

export function MemberDashboard() {
  const memberStats = [
    {
      title: "Sessions Attended",
      value: "24/28",
      percentage: 86,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Goals This Season",
      value: "7",
      change: "+2 this month",
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Team Position",
      value: "#3",
      change: "Midfielder",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Skill Rating",
      value: "8.2/10",
      change: "+0.5 improvement",
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Training Session",
      type: "training",
      date: "Today",
      time: "4:00 PM - 6:00 PM",
      location: "Main Field",
      coach: "Sarah Johnson"
    },
    {
      id: 2,
      title: "Match vs Chelsea Academy",
      type: "match",
      date: "Saturday",
      time: "10:00 AM - 12:00 PM",
      location: "Away Ground",
      coach: "Mike Roberts"
    },
    {
      id: 3,
      title: "Skills Workshop",
      type: "workshop",
      date: "Sunday",
      time: "2:00 PM - 4:00 PM",
      location: "Training Center",
      coach: "David Wilson"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "training",
      title: "Completed training session",
      date: "Yesterday",
      rating: 4.5,
      notes: "Excellent performance in passing drills"
    },
    {
      id: 2,
      type: "match",
      title: "Arsenal Academy Match",
      date: "Last Saturday",
      rating: 4.2,
      notes: "Scored 2 goals, great teamwork"
    },
    {
      id: 3,
      type: "assessment",
      title: "Monthly Skills Assessment",
      date: "Last Week",
      rating: 4.0,
      notes: "Improvement in ball control and speed"
    }
  ];

  const teammates = [
    {
      id: 1,
      name: "Alex Martinez",
      position: "Forward",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Emma Chen",
      position: "Defender",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "James Wilson",
      position: "Goalkeeper",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 4,
      name: "Sofia Rodriguez",
      position: "Midfielder",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const achievements = [
    { title: "Perfect Attendance", description: "Attended all sessions this month", icon: "🏆" },
    { title: "Team Player", description: "Most assists in the last 3 matches", icon: "🤝" },
    { title: "Goal Scorer", description: "Scored in 5 consecutive matches", icon: "⚽" },
    { title: "Skill Master", description: "Improved rating by 0.5 points", icon: "⭐" }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 rounded-2xl">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" className="rounded-2xl object-cover" />
            <AvatarFallback className="rounded-2xl bg-primary text-white text-lg">JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, John Doe</h1>
            <p className="text-gray-600">Manchester United Youth • Midfielder • Jersey #10</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-gray-200 hover:border-gray-300">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </Button>
          <Button className="rounded-xl gradient-primary text-white hover:opacity-90">
            <Calendar className="w-4 h-4 mr-2" />
            View Schedule
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {memberStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.change && (
                    <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
                  )}
                  {stat.percentage && (
                    <div className="mt-2">
                      <Progress value={stat.percentage} className="h-2" />
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card className="border-0 shadow-lg rounded-xl lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Events</CardTitle>
            <CardDescription className="text-gray-600">Your schedule for the next few days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <Badge 
                        variant={event.type === 'match' ? 'default' : 'secondary'}
                        className="rounded-lg"
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Coach: {event.coach}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg ml-4">
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{achievement.title}</p>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Teammates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Activities</CardTitle>
            <CardDescription className="text-gray-600">Your latest training and match performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-900">{activity.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{activity.notes}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Teammates</CardTitle>
            <CardDescription className="text-gray-600">Connect with your team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teammates.map((teammate) => (
              <div key={teammate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 rounded-xl">
                    <AvatarImage src={teammate.avatar} className="rounded-xl object-cover" />
                    <AvatarFallback className="rounded-xl bg-primary text-white">
                      {teammate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{teammate.name}</p>
                    <p className="text-sm text-gray-600">{teammate.position}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full rounded-xl border-gray-200 hover:border-gray-300">
              View All Teammates
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Performance Summary</CardTitle>
          <CardDescription className="text-gray-600">Your progress over the last month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 mb-1">86%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
              <Progress value={86} className="h-2 mt-2" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 mb-1">4.3</div>
              <div className="text-sm text-gray-600">Avg Performance</div>
              <Progress value={86} className="h-2 mt-2" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 mb-1">7</div>
              <div className="text-sm text-gray-600">Goals Scored</div>
              <Progress value={70} className="h-2 mt-2" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
              <div className="text-sm text-gray-600">Assists Made</div>
              <Progress value={60} className="h-2 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}