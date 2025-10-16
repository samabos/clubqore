import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  MessageSquare, 
  Send, 
  Bell, 
  Users, 
  Mail, 
  Phone,
  Search,
  Plus,
  MoreVertical,
  Pin,
  Archive
} from "lucide-react";

export function Communication() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [newMessage, setNewMessage] = useState("");

  const conversations = [
    {
      id: 1,
      name: "Manchester United Youth",
      lastMessage: "Training session moved to 4 PM tomorrow",
      time: "2 min ago",
      unread: 2,
      type: "club",
      avatar: "MU"
    },
    {
      id: 2,
      name: "Parents Group - Chelsea FC",
      lastMessage: "Please confirm attendance for the match on Saturday",
      time: "15 min ago",
      unread: 0,
      type: "group",
      avatar: "CF"
    },
    {
      id: 3,
      name: "John Smith (Parent)",
      lastMessage: "Thank you for the update about my son's progress",
      time: "1 hour ago",
      unread: 1,
      type: "individual",
      avatar: "JS"
    },
    {
      id: 4,
      name: "Liverpool FC Youth",
      lastMessage: "New training equipment has arrived",
      time: "3 hours ago",
      unread: 0,
      type: "club",
      avatar: "LF"
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "Coach Mike",
      message: "Good morning everyone! Just a reminder that tomorrow's training session has been moved to 4 PM due to field maintenance.",
      time: "9:30 AM",
      isOwn: false
    },
    {
      id: 2,
      sender: "You",
      message: "Thanks for letting us know. Should we bring any additional equipment?",
      time: "9:45 AM",
      isOwn: true
    },
    {
      id: 3,
      sender: "Coach Mike",
      message: "Just the usual gear. We'll have cones and balls ready. See you all tomorrow!",
      time: "9:50 AM",
      isOwn: false
    }
  ];

  const notifications = [
    {
      id: 1,
      title: "New Member Joined",
      description: "Emma Wilson has joined Chelsea FC Academy",
      time: "5 min ago",
      type: "member",
      read: false
    },
    {
      id: 2,
      title: "Payment Received",
      description: "Monthly subscription payment from Liverpool FC Youth",
      time: "1 hour ago",
      type: "payment",
      read: false
    },
    {
      id: 3,
      title: "Event Reminder",
      description: "Arsenal vs Chelsea match starts in 2 hours",
      time: "2 hours ago",
      type: "event",
      read: true
    },
    {
      id: 4,
      title: "Low Attendance Alert",
      description: "Training session attendance below 70% threshold",
      time: "5 hours ago",
      type: "alert",
      read: true
    }
  ];

  const sendMessage = () => {
    if (newMessage.trim()) {
      // Add message logic here
      setNewMessage("");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conversations</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Search conversations..." className="pl-10" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 border-b ${
                        selectedChat === conversation.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedChat(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{conversation.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{conversation.name}</h4>
                            <span className="text-xs text-muted-foreground">{conversation.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-xs">
                              {conversation.type}
                            </Badge>
                            {conversation.unread > 0 && (
                              <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 flex flex-col">
              {selectedChat ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {conversations.find(c => c.id === selectedChat)?.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">
                            {conversations.find(c => c.id === selectedChat)?.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {conversations.find(c => c.id === selectedChat)?.type === 'group' 
                              ? '12 members' : 'Online'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {!message.isOwn && (
                              <p className="text-xs font-medium mb-1">{message.sender}</p>
                            )}
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {message.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Stay updated with important club activities</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Mark All as Read
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'member' ? 'bg-green-100' :
                          notification.type === 'payment' ? 'bg-blue-100' :
                          notification.type === 'event' ? 'bg-purple-100' : 'bg-orange-100'
                        }`}>
                          {notification.type === 'member' && <Users className="w-4 h-4" />}
                          {notification.type === 'payment' && <Mail className="w-4 h-4" />}
                          {notification.type === 'event' && <Bell className="w-4 h-4" />}
                          {notification.type === 'alert' && <Bell className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Pin className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Message</CardTitle>
              <CardDescription>Send messages to multiple clubs or groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-clubs">All Clubs</SelectItem>
                        <SelectItem value="active-clubs">Active Clubs Only</SelectItem>
                        <SelectItem value="premium-clubs">Premium Clubs</SelectItem>
                        <SelectItem value="all-parents">All Parents</SelectItem>
                        <SelectItem value="specific-club">Specific Club</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="messageType">Message Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select message type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="update">System Update</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="Enter message subject" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Enter your message here..."
                      rows={8}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  This message will be sent to approximately <strong>156 recipients</strong>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Save Draft</Button>
                  <Button>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}