import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  User,
  Calendar,
  Trophy,
  Clock,
  MessageSquare,
  MapPin,
  Phone,
  TrendingUp,
  Star,
  CheckCircle,
} from "lucide-react";

export function ParentModule() {
  const [selectedChild, setSelectedChild] = useState("john-smith");

  const children = [
    {
      id: "john-smith",
      name: "John Smith",
      age: 16,
      club: "Manchester United Youth",
      position: "Forward",
      coachName: "Mike Johnson",
      joinDate: "2024-01-15",
      avatar: "JS",
    },
    {
      id: "emma-smith",
      name: "Emma Smith",
      age: 14,
      club: "Chelsea FC Academy",
      position: "Midfielder",
      coachName: "Sarah Wilson",
      joinDate: "2024-03-20",
      avatar: "ES",
    },
  ];

  const selectedChildData = children.find(
    (child) => child.id === selectedChild
  );

  const progressData = {
    "john-smith": {
      attendanceRate: 92,
      skillRating: 4.2,
      improvements: [
        { skill: "Ball Control", rating: 4.5, change: "+0.3" },
        { skill: "Passing", rating: 4.0, change: "+0.2" },
        { skill: "Shooting", rating: 4.3, change: "+0.1" },
        { skill: "Defense", rating: 3.8, change: "+0.4" },
      ],
      recentAchievements: [
        { title: "Player of the Month", date: "November 2024", type: "award" },
        {
          title: "Goal Scoring Record",
          date: "October 2024",
          type: "milestone",
        },
        {
          title: "Perfect Attendance",
          date: "September 2024",
          type: "attendance",
        },
      ],
    },
    "emma-smith": {
      attendanceRate: 95,
      skillRating: 4.0,
      improvements: [
        { skill: "Ball Control", rating: 4.2, change: "+0.2" },
        { skill: "Passing", rating: 4.3, change: "+0.3" },
        { skill: "Shooting", rating: 3.7, change: "+0.1" },
        { skill: "Defense", rating: 4.1, change: "+0.2" },
      ],
      recentAchievements: [
        { title: "Most Improved Player", date: "November 2024", type: "award" },
        { title: "Team Captain", date: "October 2024", type: "leadership" },
      ],
    },
  };

  const upcomingEvents = [
    {
      id: 1,
      title: "Training Session",
      date: "2024-12-23",
      time: "10:00 AM",
      location: "Old Trafford Training Ground",
      type: "training",
      status: "confirmed",
    },
    {
      id: 2,
      title: "Match vs Chelsea Youth",
      date: "2024-12-25",
      time: "3:00 PM",
      location: "Stamford Bridge",
      type: "match",
      status: "confirmed",
    },
    {
      id: 3,
      title: "Skills Workshop",
      date: "2024-12-27",
      time: "2:00 PM",
      location: "Academy Training Center",
      type: "workshop",
      status: "pending",
    },
  ];

  const recentMessages = [
    {
      id: 1,
      from: "Coach Mike Johnson",
      subject: "Great progress in training",
      message:
        "John showed excellent improvement in his passing accuracy during today's training session.",
      date: "2024-12-20",
      read: false,
    },
    {
      id: 2,
      from: "Club Administrator",
      subject: "Match schedule update",
      message:
        "The upcoming match against Chelsea has been confirmed for December 25th at 3:00 PM.",
      date: "2024-12-19",
      read: true,
    },
    {
      id: 3,
      from: "Coach Mike Johnson",
      subject: "Monthly progress report",
      message:
        "John's monthly progress report is now available in the parent portal.",
      date: "2024-12-18",
      read: true,
    },
  ];

  const currentProgress =
    progressData[selectedChild as keyof typeof progressData];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "training":
        return "bg-blue-100 text-blue-800";
      case "match":
        return "bg-red-100 text-red-800";
      case "workshop":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "award":
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case "milestone":
        return <Star className="w-4 h-4 text-purple-600" />;
      case "attendance":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "leadership":
        return <User className="w-4 h-4 text-blue-600" />;
      default:
        return <Trophy className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Child Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parent Dashboard</CardTitle>
              <CardDescription>
                Monitor your child's football progress and activities
              </CardDescription>
            </div>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Child Overview */}
      {selectedChildData && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedChildData.name}`}
                />
                <AvatarFallback className="text-lg">
                  {selectedChildData.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{selectedChildData.name}</h3>
                <p className="text-muted-foreground">
                  Age {selectedChildData.age} • {selectedChildData.position}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedChildData.club}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Coach: {selectedChildData.coachName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined: {selectedChildData.joinDate}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Coach
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Club Info
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Current skill ratings and attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {currentProgress.attendanceRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Attendance Rate
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentProgress.skillRating}/5
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Overall Rating
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Skill Development</h4>
                  {currentProgress.improvements.map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {skill.skill}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{skill.rating}/5</span>
                          <Badge variant="outline" className="text-green-600">
                            {skill.change}
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={(skill.rating / 5) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>Awards and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentProgress.recentAchievements.map(
                    (achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        {getAchievementIcon(achievement.type)}
                        <div className="flex-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {achievement.date}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Progress Trend</CardTitle>
              <CardDescription>Skill development over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                  <p>Progress chart visualization would be displayed here</p>
                  <p className="text-sm">
                    Showing skill improvements over the last 6 months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>
                Training sessions, matches, and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{event.title}</h4>
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {event.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              event.status === "confirmed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {event.status}
                          </Badge>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Messages from Coach & Club</CardTitle>
                  <CardDescription>
                    Important updates and feedback
                  </CardDescription>
                </div>
                <Button>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={
                      !message.read ? "border-blue-200 bg-blue-50/50" : ""
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{message.subject}</h4>
                            {!message.read && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            From: {message.from}
                          </p>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {message.date}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Reply
                          </Button>
                          <Button size="sm" variant="outline">
                            Archive
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>
                  Current subscription and payment status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">$89</div>
                    <p className="text-sm text-muted-foreground">Monthly Fee</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      Paid
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current Status
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Next Payment Due</span>
                    <span className="font-medium">Jan 15, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-medium">•••• 1234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-Pay</span>
                    <Badge className="bg-green-100 text-green-800">
                      Enabled
                    </Badge>
                  </div>
                </div>

                <Button className="w-full">Update Payment Method</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Recent payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      date: "Dec 15, 2024",
                      amount: "$89",
                      status: "Paid",
                      method: "•••• 1234",
                    },
                    {
                      date: "Nov 15, 2024",
                      amount: "$89",
                      status: "Paid",
                      method: "•••• 1234",
                    },
                    {
                      date: "Oct 15, 2024",
                      amount: "$89",
                      status: "Paid",
                      method: "•••• 1234",
                    },
                  ].map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{payment.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          {payment.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {payment.method}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
