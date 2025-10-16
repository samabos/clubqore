import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Users,
  Building2,
  CreditCard,
  MessageSquare,
  Calendar,
  CheckCircle,
  Settings,
  Shield,
  Heart,
} from "lucide-react";

export function WelcomePage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">CQ</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome to ClubQore
            </h1>
          </div>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          The complete solution for football club management. From member
          registration to billing, communication to attendance tracking -
          everything you need to run your club efficiently.
        </p>
      </div>

      {/* Contact Admin Section */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-orange-600" />
          </div>
          <CardTitle className="text-orange-900">
            Account Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-orange-800">
            Your account needs to be set up with appropriate permissions to
            access club features.
          </p>
          <p className="text-orange-700 font-medium">
            Please contact your club administrator to assign your role and
            complete your account setup.
          </p>
          <Button
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Contact Support
          </Button>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <CardTitle className="text-lg">Member Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Streamlined registration, profile management, and member
              communication tools.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Building2 className="w-8 h-8 text-green-600 mb-2" />
            <CardTitle className="text-lg">Club Administration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Complete club setup, team management, and administrative
              oversight.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Calendar className="w-8 h-8 text-purple-600 mb-2" />
            <CardTitle className="text-lg">Scheduling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Training sessions, matches, and event scheduling with automated
              notifications.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CheckCircle className="w-8 h-8 text-teal-600 mb-2" />
            <CardTitle className="text-lg">Attendance Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Real-time attendance monitoring for training and matches.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CreditCard className="w-8 h-8 text-orange-600 mb-2" />
            <CardTitle className="text-lg">Payments & Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Automated billing, payment tracking, and financial reporting.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <MessageSquare className="w-8 h-8 text-pink-600 mb-2" />
            <CardTitle className="text-lg">Communication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Integrated messaging, announcements, and parent-club
              communication.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Information */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Different Roles, Tailored Experience
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <Settings className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Administrators</h3>
            <p className="text-sm text-gray-600">
              Full system access, user management, and system configuration.
            </p>
          </div>
          <div className="text-center">
            <Building2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Club Managers</h3>
            <p className="text-sm text-gray-600">
              Club operations, member management, and billing oversight.
            </p>
          </div>
          <div className="text-center">
            <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Members</h3>
            <p className="text-sm text-gray-600">
              Personal dashboard, schedule viewing, and attendance tracking.
            </p>
          </div>
          <div className="text-center">
            <Heart className="w-12 h-12 text-pink-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Parents</h3>
            <p className="text-sm text-gray-600">
              Children's activities, payments, and communication with coaches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
