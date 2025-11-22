import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
} from "lucide-react";
import { useAuth } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

export function ClubDetails() {
  const { userClub } = useAuth();
  const navigate = useNavigate();

  if (!userClub) {
    return (
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Club Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Club Setup
            </h3>
            <p className="text-gray-600 mb-4">
              Set up your club profile to get started
            </p>
            <Button
              onClick={() => navigate("/app/club/setup")}
              className="rounded-xl gradient-primary text-white hover:opacity-90"
            >
              Set Up Club
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Club Details
          </CardTitle>
          <Button
            onClick={() => navigate("/app/club/setup")}
            variant="outline"
            className="rounded-xl"
          >
            Edit Details
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Club Logo and Name */}
          <div className="flex items-center gap-4">
            {userClub.logo_url ? (
              <img
                src={userClub.logo_url}
                alt={`${userClub.name} logo`}
                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {userClub.name}
              </h3>
              <p className="text-sm text-gray-500">{userClub.clubType}</p>
            </div>
          </div>

          {/* Club Description */}
          {userClub.description && (
            <div>
              <p className="text-sm text-gray-600">{userClub.description}</p>
            </div>
          )}

          {/* Club Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            {/* Founded Year */}
            {userClub.foundedYear && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Founded {userClub.foundedYear}
                </span>
              </div>
            )}

            {/* Membership Capacity */}
            {userClub.membershipCapacity && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Capacity: {userClub.membershipCapacity} members
                </span>
              </div>
            )}

            {/* Address */}
            {userClub.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {userClub.address}
                </span>
              </div>
            )}

            {/* Phone */}
            {userClub.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{userClub.phone}</span>
              </div>
            )}

            {/* Email */}
            {userClub.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{userClub.email}</span>
              </div>
            )}

            {/* Website */}
            {userClub.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <a
                  href={
                    userClub.website.startsWith("http")
                      ? userClub.website
                      : `https://${userClub.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {userClub.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
