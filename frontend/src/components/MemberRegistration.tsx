import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Plus, Search, Edit, Trash2, Upload, Camera } from "lucide-react";
import { format } from "date-fns";

export function MemberRegistration() {
  const [date, setDate] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState("");
  const [profileImage, setProfileImage] = useState<string>("");

  const existingMembers = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1234567890",
      club: "Manchester United Youth",
      position: "Forward",
      age: 16,
      status: "Active",
      joinDate: "2024-01-15",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Emma Johnson",
      email: "emma.johnson@email.com",
      phone: "+1234567891",
      club: "Chelsea FC Academy",
      position: "Midfielder",
      age: 15,
      status: "Active",
      joinDate: "2024-02-20",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@email.com",
      phone: "+1234567892",
      club: "Liverpool FC Youth",
      position: "Goalkeeper",
      age: 17,
      status: "Inactive",
      joinDate: "2023-09-10",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      phone: "+1234567893",
      club: "Arsenal Academy",
      position: "Defender",
      age: 16,
      status: "Active",
      joinDate: "2024-01-20",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const filteredMembers = existingMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.club.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="register" className="rounded-lg">Register New Member</TabsTrigger>
          <TabsTrigger value="manage" className="rounded-lg">Manage Members</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">Member Registration Form</CardTitle>
              <CardDescription className="text-gray-600">Register a new member to your football club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 rounded-2xl shadow-lg">
                    {profileImage ? (
                      <AvatarImage src={profileImage} className="rounded-2xl object-cover" />
                    ) : (
                      <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white text-2xl">
                        <Camera className="w-12 h-12" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label htmlFor="profile-upload" className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                    <Upload className="w-4 h-4" />
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Member Profile Picture</p>
                  <p className="text-xs text-gray-500">Upload a profile picture for the member</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Personal Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Enter first name" 
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Enter last name" 
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter email address" 
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="Enter phone number" 
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal rounded-xl border-gray-200 hover:border-primary"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Club Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Club Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="club" className="text-sm font-medium text-gray-700">Select Club</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue placeholder="Choose a club" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="manchester-united">Manchester United Youth</SelectItem>
                        <SelectItem value="chelsea-fc">Chelsea FC Academy</SelectItem>
                        <SelectItem value="liverpool-fc">Liverpool FC Youth</SelectItem>
                        <SelectItem value="arsenal-fc">Arsenal Academy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium text-gray-700">Playing Position</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                        <SelectItem value="defender">Defender</SelectItem>
                        <SelectItem value="midfielder">Midfielder</SelectItem>
                        <SelectItem value="forward">Forward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-sm font-medium text-gray-700">Experience Level</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700">Emergency Contact</Label>
                    <Input 
                      id="emergencyContact" 
                      placeholder="Emergency contact name" 
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="text-sm font-medium text-gray-700">Emergency Phone</Label>
                    <Input 
                      id="emergencyPhone" 
                      type="tel" 
                      placeholder="Emergency contact phone" 
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Additional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="medicalConditions" className="text-sm font-medium text-gray-700">Medical Conditions</Label>
                    <Textarea 
                      id="medicalConditions" 
                      placeholder="Any medical conditions or allergies (optional)"
                      rows={4}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Additional Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Any additional information about the member (optional)"
                      rows={4}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <Button className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Member
                </Button>
                <Button variant="outline" className="rounded-xl px-8 py-3 border-gray-200 hover:border-gray-300">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Member Directory</CardTitle>
                  <CardDescription className="text-gray-600">Manage and view all registered members</CardDescription>
                </div>
                <Button className="rounded-xl gradient-primary text-white hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search members by name or club..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
                      <SelectValue placeholder="Filter by club" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Clubs</SelectItem>
                      <SelectItem value="manchester-united">Manchester United</SelectItem>
                      <SelectItem value="chelsea-fc">Chelsea FC</SelectItem>
                      <SelectItem value="liverpool-fc">Liverpool FC</SelectItem>
                      <SelectItem value="arsenal-fc">Arsenal FC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredMembers.map((member) => (
                    <Card key={member.id} className="border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-16 h-16 rounded-2xl shadow-md">
                              <AvatarImage 
                                src={member.profileImage} 
                                className="rounded-2xl object-cover"
                                alt={member.name}
                              />
                              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-900">{member.name}</h4>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              <p className="text-sm text-gray-500">{member.phone}</p>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{member.club}</p>
                            <p className="text-sm text-gray-600">{member.position}</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="font-medium text-gray-900">Age: {member.age}</p>
                            <Badge 
                              variant={member.status === 'Active' ? 'default' : 'secondary'}
                              className="rounded-lg"
                            >
                              {member.status}
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg border-gray-200 hover:border-gray-300">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg border-gray-200 hover:border-gray-300">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}