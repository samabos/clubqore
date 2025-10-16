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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import {
  Upload,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export function ProfileManagement() {
  const [profileImage, setProfileImage] = useState<string>("");
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    newsletter: true,
    events: true,
    payments: true,
    announcements: false,
  });

  const transactionHistory = [
    {
      id: 1,
      type: "payment",
      description: "Monthly Membership Fee",
      amount: -89.0,
      date: "2024-01-15",
      status: "completed",
      method: "Credit Card",
    },
    {
      id: 2,
      type: "refund",
      description: "Training Session Refund",
      amount: 25.0,
      date: "2024-01-10",
      status: "completed",
      method: "Credit Card",
    },
    {
      id: 3,
      type: "payment",
      description: "Registration Fee",
      amount: -50.0,
      date: "2024-01-05",
      status: "completed",
      method: "Bank Transfer",
    },
    {
      id: 4,
      type: "payment",
      description: "Equipment Purchase",
      amount: -120.0,
      date: "2024-01-03",
      status: "pending",
      method: "Credit Card",
    },
    {
      id: 5,
      type: "payment",
      description: "December Membership Fee",
      amount: -89.0,
      date: "2023-12-15",
      status: "completed",
      method: "Credit Card",
    },
  ];

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

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Management
          </h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg">
            Profile
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-lg">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg">
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Personal Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Update your profile details and photo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 rounded-2xl shadow-lg">
                    {profileImage ? (
                      <AvatarImage
                        src={profileImage}
                        className="rounded-2xl object-cover"
                      />
                    ) : (
                      <AvatarImage
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                        className="rounded-2xl object-cover"
                      />
                    )}
                    <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white text-2xl">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-upload"
                    className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors"
                  >
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
                  <p className="text-sm font-medium text-gray-900">
                    Profile Picture
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG or GIF (max. 2MB)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Basic Information
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-gray-700"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      defaultValue="John"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      defaultValue="Doe"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="john.doe@email.com"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="dateOfBirth"
                      className="text-sm font-medium text-gray-700"
                    >
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      defaultValue="1995-06-15"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Club & Address Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Club & Address
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="club"
                      className="text-sm font-medium text-gray-700"
                    >
                      Current Club
                    </Label>
                    <Select defaultValue="manchester-united">
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="manchester-united">
                          Manchester United Youth
                        </SelectItem>
                        <SelectItem value="chelsea-fc">
                          Chelsea FC Academy
                        </SelectItem>
                        <SelectItem value="liverpool-fc">
                          Liverpool FC Youth
                        </SelectItem>
                        <SelectItem value="arsenal-fc">
                          Arsenal Academy
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="position"
                      className="text-sm font-medium text-gray-700"
                    >
                      Playing Position
                    </Label>
                    <Select defaultValue="midfielder">
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue />
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
                    <Label
                      htmlFor="address"
                      className="text-sm font-medium text-gray-700"
                    >
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      defaultValue="123 Football Street, Manchester, UK M1 2AB"
                      rows={3}
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContact"
                      className="text-sm font-medium text-gray-700"
                    >
                      Emergency Contact
                    </Label>
                    <Input
                      id="emergencyContact"
                      defaultValue="Jane Doe (Mother)"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyPhone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Emergency Phone
                    </Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      defaultValue="+1 (555) 987-6543"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <Button className="rounded-xl gradient-primary text-white hover:opacity-90 px-8">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:border-gray-300 px-8"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    View your payment history and download receipts
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:border-gray-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactionHistory.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          transaction.status === "completed"
                            ? "bg-green-50"
                            : transaction.status === "pending"
                            ? "bg-yellow-50"
                            : "bg-red-50"
                        }`}
                      >
                        {transaction.status === "completed" ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : transaction.status === "pending" ? (
                          <Clock className="w-6 h-6 text-yellow-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {transaction.description}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {transaction.date} • {transaction.method}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}$
                        {Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : transaction.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className="rounded-lg mt-1"
                      >
                        {transaction.status}
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg ml-4"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-gray-600">
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("email", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      SMS Notifications
                    </p>
                    <p className="text-sm text-gray-600">
                      Receive important updates via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("sms", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      Push Notifications
                    </p>
                    <p className="text-sm text-gray-600">
                      Receive push notifications on your devices
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("push", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Notification Types
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">Newsletter</p>
                        <p className="text-sm text-gray-600">
                          Weekly club updates and news
                        </p>
                      </div>
                      <Switch
                        checked={notifications.newsletter}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("newsletter", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          Event Reminders
                        </p>
                        <p className="text-sm text-gray-600">
                          Training sessions and match reminders
                        </p>
                      </div>
                      <Switch
                        checked={notifications.events}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("events", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          Payment Alerts
                        </p>
                        <p className="text-sm text-gray-600">
                          Payment confirmations and due date reminders
                        </p>
                      </div>
                      <Switch
                        checked={notifications.payments}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("payments", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          Club Announcements
                        </p>
                        <p className="text-sm text-gray-600">
                          Important announcements from your club
                        </p>
                      </div>
                      <Switch
                        checked={notifications.announcements}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("announcements", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <Button className="rounded-xl gradient-primary text-white hover:opacity-90 px-8">
                  Save Preferences
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:border-gray-300 px-8"
                >
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Security Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Change Password
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Two-Factor Authentication
                  </h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">Enable 2FA</p>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl border-gray-200 hover:border-gray-300"
                    >
                      Enable
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Privacy Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Profile Visibility
                        </p>
                        <p className="text-sm text-gray-600">
                          Allow other members to view your profile
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Show Activity Status
                        </p>
                        <p className="text-sm text-gray-600">
                          Show when you're online to teammates
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <Button className="rounded-xl gradient-primary text-white hover:opacity-90 px-8">
                  Update Security
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:border-gray-300 px-8"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
