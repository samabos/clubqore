import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, MapPin, Phone, Heart, AlertCircle } from "lucide-react";
import type { ChildDetailData } from "../types";

interface ChildProfileSectionProps {
  child: ChildDetailData;
}

export function ChildProfileSection({ child }: ChildProfileSectionProps) {
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <p className="text-base font-semibold">
              {child.firstName} {child.lastName}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-base">{formatDate(child.dateOfBirth)}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Age</label>
            <p className="text-base font-semibold">{calculateAge(child.dateOfBirth)} years old</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Position</label>
            <p className="text-base">{child.position || "Not specified"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Membership Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Membership Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Club</label>
            <p className="text-base font-semibold">{child.clubName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Enrollment Status</label>
            <div className="mt-1">
              <Badge className={getEnrollmentStatusColor(child.enrollmentStatus)}>
                {child.enrollmentStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      {(child.phone || child.address) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {child.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="text-base">{child.phone}</p>
              </div>
            )}
            {child.address && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-base">{child.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medical Information */}
      {child.medicalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{child.medicalInfo}</p>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      {child.emergencyContact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{child.emergencyContact}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
