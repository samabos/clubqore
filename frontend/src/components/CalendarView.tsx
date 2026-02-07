import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar } from "./ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

export function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const events = [
    {
      id: 1,
      title: "Manchester United vs Chelsea",
      type: "match",
      club: "Manchester United Youth",
      date: "2024-12-22",
      time: "15:00",
      location: "Old Trafford Training Ground",
      participants: 22,
      status: "confirmed",
      description: "Important league match between youth teams"
    },
    {
      id: 2,
      title: "Liverpool FC Training Session",
      type: "training",
      club: "Liverpool FC Youth",
      date: "2024-12-23",
      time: "10:00",
      location: "Anfield Training Center",
      participants: 18,
      status: "confirmed",
      description: "Regular training session focusing on defensive strategies"
    },
    {
      id: 3,
      title: "Arsenal Academy Tournament",
      type: "tournament",
      club: "Arsenal Academy",
      date: "2024-12-25",
      time: "14:00",
      location: "Emirates Training Ground",
      participants: 64,
      status: "pending",
      description: "Annual Christmas tournament with multiple youth teams"
    },
    {
      id: 4,
      title: "Chelsea FC Skills Workshop",
      type: "workshop",
      club: "Chelsea FC Academy",
      date: "2024-12-24",
      time: "11:00",
      location: "Stamford Bridge Academy",
      participants: 15,
      status: "confirmed",
      description: "Technical skills development workshop for advanced players"
    },
    {
      id: 5,
      title: "Parent Meeting - Season Review",
      type: "meeting",
      club: "All Clubs",
      date: "2024-12-26",
      time: "19:00",
      location: "Virtual Meeting",
      participants: 45,
      status: "confirmed",
      description: "End of season review meeting with parents and coaches"
    }
  ];

  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date()).slice(0, 5);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "match": return "bg-red-100 text-red-800 border-red-200";
      case "training": return "bg-blue-100 text-blue-800 border-blue-200";
      case "tournament": return "bg-purple-100 text-purple-800 border-purple-200";
      case "workshop": return "bg-green-100 text-green-800 border-green-200";
      case "meeting": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-green-600";
      case "pending": return "text-orange-600";
      case "cancelled": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Event Calendar</h2>
          <p className="text-muted-foreground">Manage matches, training sessions, and club events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>Add a new event to the calendar</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">Event Title</Label>
                    <Input id="eventTitle" placeholder="Enter event title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">Match</SelectItem>
                        <SelectItem value="training">Training Session</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Date</Label>
                    <Input id="eventDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventTime">Time</Label>
                    <Input id="eventTime" type="time" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventClub">Club</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select club" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manchester-united">Manchester United Youth</SelectItem>
                        <SelectItem value="chelsea-fc">Chelsea FC Academy</SelectItem>
                        <SelectItem value="liverpool-fc">Liverpool FC Youth</SelectItem>
                        <SelectItem value="arsenal-fc">Arsenal Academy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventLocation">Location</Label>
                    <Input id="eventLocation" placeholder="Enter location" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Description</Label>
                  <Textarea id="eventDescription" placeholder="Event description" rows={3} />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Event</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Event Types</h4>
                  <div className="space-y-1">
                    {[
                      { type: "match", label: "Matches", count: 8 },
                      { type: "training", label: "Training", count: 15 },
                      { type: "tournament", label: "Tournaments", count: 3 },
                      { type: "workshop", label: "Workshops", count: 5 },
                      { type: "meeting", label: "Meetings", count: 4 }
                    ].map((item) => (
                      <div key={item.type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getEventTypeColor(item.type).split(' ')[0]}`}></div>
                          <span>{item.label}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  Events for {date ? format(date, "MMMM d, yyyy") : "Selected Date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge className={getEventTypeColor(event.type)}>
                                {event.type}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{event.date}</span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{event.participants} participants</span>
                              </div>
                            </div>
                            <p className="text-sm">{event.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Events</CardTitle>
              <CardDescription>Complete list of scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium">{format(new Date(event.date), "MMM")}</p>
                            <p className="text-2xl font-bold">{format(new Date(event.date), "d")}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge className={getEventTypeColor(event.type)}>
                                {event.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {event.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {event.participants} participants
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.club}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
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

        <TabsContent value="upcoming" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next events in chronological order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {upcomingEvents.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      {index < upcomingEvents.length - 1 && (
                        <div className="w-px h-16 bg-border mt-2"></div>
                      )}
                    </div>
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge className={getEventTypeColor(event.type)}>
                                {event.type}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>{event.club}</p>
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4" />
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
                          </div>
                          <Button size="sm">View Details</Button>
                        </div>
                      </CardContent>
                    </Card>
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