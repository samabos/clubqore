import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Search,
  MapPin,
  Upload,
} from "lucide-react";

export function ClubManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clubLogo, setClubLogo] = useState<string>("");

  const clubs = [
    {
      id: 1,
      name: "Manchester United Youth",
      description:
        "Premier youth football academy focusing on developing future stars",
      address: "Old Trafford, Manchester, UK",
      contactEmail: "info@manutyouth.com",
      contactPhone: "+44 161 868 8000",
      members: 156,
      monthlyFee: 89,
      status: "Active",
      founded: "2010",
      category: "Youth Academy",
      logo: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=150&h=150&fit=crop",
    },
    {
      id: 2,
      name: "Chelsea FC Academy",
      description:
        "Elite football training academy with world-class facilities",
      address: "Stamford Bridge, London, UK",
      contactEmail: "academy@chelseafc.com",
      contactPhone: "+44 20 7386 9373",
      members: 234,
      monthlyFee: 95,
      status: "Active",
      founded: "2008",
      category: "Professional Academy",
      logo: "https://images.unsplash.com/photo-1614632537379-d1d7d2c08895?w=150&h=150&fit=crop",
    },
    {
      id: 3,
      name: "Liverpool FC Youth",
      description: "Developing the next generation of Liverpool footballers",
      address: "Anfield, Liverpool, UK",
      contactEmail: "youth@liverpoolfc.com",
      contactPhone: "+44 151 263 2361",
      members: 189,
      monthlyFee: 85,
      status: "Active",
      founded: "2012",
      category: "Youth Academy",
      logo: "https://images.unsplash.com/photo-1552318965-6e6be7484ada?w=150&h=150&fit=crop",
    },
    {
      id: 4,
      name: "Arsenal Academy",
      description: "World-class training facility for developing young talent",
      address: "Emirates Stadium, London, UK",
      contactEmail: "academy@arsenal.com",
      contactPhone: "+44 20 7619 5003",
      members: 145,
      monthlyFee: 92,
      status: "Active",
      founded: "2009",
      category: "Professional Academy",
      logo: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=150&h=150&fit=crop",
    },
  ];

  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setClubLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="register" className="rounded-lg">
            Register New Club
          </TabsTrigger>
          <TabsTrigger value="manage" className="rounded-lg">
            Manage Clubs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Club Registration Form
              </CardTitle>
              <CardDescription className="text-gray-600">
                Register a new football club on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Club Logo Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 rounded-2xl shadow-lg">
                    {clubLogo ? (
                      <AvatarImage
                        src={clubLogo}
                        className="rounded-2xl object-cover"
                      />
                    ) : (
                      <AvatarFallback className="rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-white text-2xl">
                        <Building2 className="w-12 h-12" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="logo-upload"
                    className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Club Logo</p>
                  <p className="text-xs text-gray-500">
                    Upload your club's logo or badge
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Basic Information
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="clubName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Club Name
                    </Label>
                    <Input
                      id="clubName"
                      placeholder="Enter club name"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="clubCategory"
                      className="text-sm font-medium text-gray-700"
                    >
                      Club Category
                    </Label>
                    <Select>
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="youth-academy">
                          Youth Academy
                        </SelectItem>
                        <SelectItem value="professional-academy">
                          Professional Academy
                        </SelectItem>
                        <SelectItem value="amateur-club">
                          Amateur Club
                        </SelectItem>
                        <SelectItem value="semi-professional">
                          Semi-Professional
                        </SelectItem>
                        <SelectItem value="recreational">
                          Recreational
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="foundedYear"
                      className="text-sm font-medium text-gray-700"
                    >
                      Founded Year
                    </Label>
                    <Input
                      id="foundedYear"
                      type="number"
                      placeholder="e.g., 2010"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700"
                    >
                      Club Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the club"
                      rows={4}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="website"
                      className="text-sm font-medium text-gray-700"
                    >
                      Website (Optional)
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.clubwebsite.com"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Contact & Location
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="contactEmail"
                      className="text-sm font-medium text-gray-700"
                    >
                      Contact Email
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="club@email.com"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="contactPhone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Contact Phone
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+1234567890"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="text-sm font-medium text-gray-700"
                    >
                      Club Address
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Full address including city, state, postal code"
                      rows={3}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="facilities"
                      className="text-sm font-medium text-gray-700"
                    >
                      Facilities
                    </Label>
                    <Textarea
                      id="facilities"
                      placeholder="Description of training facilities, fields, equipment, etc."
                      rows={4}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription & Pricing */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                  Subscription & Pricing
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="monthlyFee"
                      className="text-sm font-medium text-gray-700"
                    >
                      Monthly Member Fee ($)
                    </Label>
                    <Input
                      id="monthlyFee"
                      type="number"
                      placeholder="89"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="registrationFee"
                      className="text-sm font-medium text-gray-700"
                    >
                      Registration Fee ($)
                    </Label>
                    <Input
                      id="registrationFee"
                      type="number"
                      placeholder="25"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="maxMembers"
                      className="text-sm font-medium text-gray-700"
                    >
                      Max Members
                    </Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      placeholder="200"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="subscriptionPlan"
                    className="text-sm font-medium text-gray-700"
                  >
                    Subscription Plan
                  </Label>
                  <Select>
                    <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder="Select subscription plan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="basic">
                        Basic Plan - $49/month
                      </SelectItem>
                      <SelectItem value="standard">
                        Standard Plan - $99/month
                      </SelectItem>
                      <SelectItem value="premium">
                        Premium Plan - $199/month
                      </SelectItem>
                      <SelectItem value="enterprise">
                        Enterprise Plan - $399/month
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <Button className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Club
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl px-8 py-3 border-gray-200 hover:border-gray-300"
                >
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
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Registered Clubs
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage and view all registered football clubs
                  </CardDescription>
                </div>
                <Button className="rounded-xl gradient-primary text-white hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Club
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search clubs by name or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredClubs.map((club) => (
                    <Card
                      key={club.id}
                      className="border border-gray-100 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-6">
                            <Avatar className="w-20 h-20 rounded-2xl shadow-md flex-shrink-0">
                              <AvatarImage
                                src={club.logo}
                                className="rounded-2xl object-cover"
                                alt={`${club.name} logo`}
                              />
                              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-white">
                                {club.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-3 flex-1">
                              <div>
                                <h4 className="font-semibold text-lg text-gray-900">
                                  {club.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {club.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span>{club.address}</span>
                              </div>
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <span>{club.contactEmail}</span>
                                <span>{club.contactPhone}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right space-y-3">
                            <div className="flex gap-2">
                              <Badge
                                variant={
                                  club.status === "Active"
                                    ? "default"
                                    : "secondary"
                                }
                                className="rounded-lg"
                              >
                                {club.status}
                              </Badge>
                              <Badge variant="outline" className="rounded-lg">
                                {club.category}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {club.members} Members
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              ${club.monthlyFee}/month
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              Since {club.founded}
                            </span>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-gray-200 hover:border-gray-300"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-gray-200 hover:border-gray-300"
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-gray-200 hover:border-gray-300 text-red-600 hover:text-red-700"
                            >
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
