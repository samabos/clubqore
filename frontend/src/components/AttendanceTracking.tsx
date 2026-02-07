import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Calendar as CalendarIcon,
  Search,
  Download,
  Filter
} from "lucide-react";

export function AttendanceTracking() {
  const [searchTerm, setSearchTerm] = useState("");

  const attendanceStats = [
    {
      title: "Overall Attendance Rate",
      value: "87.5%",
      change: "+2.3%",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Average Session Attendance",
      value: "23/26",
      change: "+1",
      icon: CheckCircle,
      color: "text-blue-600"
    },
    {
      title: "Most Attended Event",
      value: "Weekend Training",
      change: "95% rate",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Attendance Alerts",
      value: "3",
      change: "-2 from last week",
      icon: Clock,
      color: "text-orange-600"
    }
  ];

  const memberAttendance = [
    {
      id: 1,
      name: "John Smith",
      club: "Manchester United Youth",
      totalSessions: 24,
      attended: 22,
      missed: 2,
      attendanceRate: 92,
      lastAttended: "2024-12-20",
      status: "excellent"
    },
    {
      id: 2,
      name: "Emma Johnson",
      club: "Chelsea FC Academy",
      totalSessions: 20,
      attended: 19,
      missed: 1,
      attendanceRate: 95,
      lastAttended: "2024-12-20",
      status: "excellent"
    },
    {
      id: 3,
      name: "Michael Brown",
      club: "Liverpool FC Youth",
      totalSessions: 26,
      attended: 18,
      missed: 8,
      attendanceRate: 69,
      lastAttended: "2024-12-15",
      status: "poor"
    },
    {
      id: 4,
      name: "Sarah Davis",
      club: "Arsenal Academy",
      totalSessions: 22,
      attended: 20,
      missed: 2,
      attendanceRate: 91,
      lastAttended: "2024-12-19",
      status: "good"
    },
    {
      id: 5,
      name: "Alex Wilson",
      club: "Chelsea FC Academy",
      totalSessions: 18,
      attended: 14,
      missed: 4,
      attendanceRate: 78,
      lastAttended: "2024-12-18",
      status: "average"
    }
  ];

  const eventAttendance = [
    {
      id: 1,
      event: "Weekly Training Session",
      date: "2024-12-20",
      club: "Manchester United Youth",
      expectedAttendees: 26,
      actualAttendees: 24,
      attendanceRate: 92,
      status: "completed"
    },
    {
      id: 2,
      event: "Match vs Chelsea",
      date: "2024-12-19",
      club: "Liverpool FC Youth",
      expectedAttendees: 18,
      actualAttendees: 18,
      attendanceRate: 100,
      status: "completed"
    },
    {
      id: 3,
      event: "Skills Workshop",
      date: "2024-12-18",
      club: "Arsenal Academy",
      expectedAttendees: 15,
      actualAttendees: 12,
      attendanceRate: 80,
      status: "completed"
    },
    {
      id: 4,
      event: "Parent Meeting",
      date: "2024-12-17",
      club: "All Clubs",
      expectedAttendees: 45,
      actualAttendees: 32,
      attendanceRate: 71,
      status: "completed"
    }
  ];

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 bg-green-50";
    if (rate >= 75) return "text-blue-600 bg-blue-50";
    if (rate >= 60) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-50";
      case "good": return "text-blue-600 bg-blue-50";
      case "average": return "text-orange-600 bg-orange-50";
      case "poor": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const filteredMembers = memberAttendance.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.club.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {attendanceStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-green-600">{stat.change}</span> from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Member Attendance</TabsTrigger>
          <TabsTrigger value="events">Event Attendance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Member Attendance Records</CardTitle>
                  <CardDescription>Track individual member attendance across all events</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search members by name or club..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      <SelectItem value="manchester-united">Manchester United</SelectItem>
                      <SelectItem value="chelsea-fc">Chelsea FC</SelectItem>
                      <SelectItem value="liverpool-fc">Liverpool FC</SelectItem>
                      <SelectItem value="arsenal-fc">Arsenal FC</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                      <SelectItem value="good">Good (75-89%)</SelectItem>
                      <SelectItem value="average">Average (60-74%)</SelectItem>
                      <SelectItem value="poor">Poor (&lt;60%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Attended</TableHead>
                      <TableHead>Missed</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Attended</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.club}</TableCell>
                        <TableCell>{member.totalSessions}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {member.attended}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            {member.missed}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{member.attendanceRate}%</span>
                            </div>
                            <Progress value={member.attendanceRate} className="h-2 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.lastAttended}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Attendance Summary</CardTitle>
              <CardDescription>Attendance rates for recent events and training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventAttendance.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{event.event}</h4>
                            <Badge variant="outline">{event.club}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {event.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {event.actualAttendees}/{event.expectedAttendees} attended
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className="text-2xl font-bold">{event.attendanceRate}%</div>
                          <Progress value={event.attendanceRate} className="h-2 w-24" />
                          <Badge className={getAttendanceColor(event.attendanceRate)}>
                            {event.attendanceRate >= 90 ? 'Excellent' : 
                             event.attendanceRate >= 75 ? 'Good' : 
                             event.attendanceRate >= 60 ? 'Average' : 'Poor'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Monthly attendance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { month: "November 2024", rate: 89, trend: "+3%" },
                    { month: "October 2024", rate: 86, trend: "+1%" },
                    { month: "September 2024", rate: 85, trend: "-2%" },
                    { month: "August 2024", rate: 87, trend: "+4%" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{item.month}</span>
                      <div className="flex items-center gap-3">
                        <Progress value={item.rate} className="h-2 w-24" />
                        <span className="text-sm font-medium">{item.rate}%</span>
                        <span className={`text-xs ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {item.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Club Comparison</CardTitle>
                <CardDescription>Attendance rates by club</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { club: "Chelsea FC Academy", rate: 95, members: 234 },
                    { club: "Manchester United Youth", rate: 92, members: 156 },
                    { club: "Liverpool FC Youth", rate: 89, members: 189 },
                    { club: "Arsenal Academy", rate: 84, members: 145 }
                  ].map((club, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{club.club}</span>
                        <span className="text-sm text-muted-foreground">{club.members} members</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={club.rate} className="h-3 flex-1" />
                        <span className="text-sm font-medium w-12">{club.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Alerts</CardTitle>
              <CardDescription>Members requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: "Michael Brown",
                    club: "Liverpool FC Youth",
                    issue: "Attendance below 70% threshold",
                    severity: "high"
                  },
                  {
                    name: "Ryan Taylor",
                    club: "Arsenal Academy",
                    issue: "Missed last 3 consecutive sessions",
                    severity: "medium"
                  },
                  {
                    name: "David Lee",
                    club: "Manchester United Youth",
                    issue: "Declining attendance trend",
                    severity: "low"
                  }
                ].map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        alert.severity === 'high' ? 'bg-red-500' :
                        alert.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">{alert.name}</p>
                        <p className="text-sm text-muted-foreground">{alert.club}</p>
                        <p className="text-sm">{alert.issue}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Contact
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}