import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Building2, Globe, MapPin, Phone } from "lucide-react";
import { CreateClubRequest } from "@/types/membership";

interface ClubSetupProps {
  clubData: Partial<CreateClubRequest>;
  onClubDataUpdate: (clubData: Partial<CreateClubRequest>) => void;
}

export function ClubSetup({ clubData, onClubDataUpdate }: ClubSetupProps) {
  const updateField = (field: keyof CreateClubRequest, value: string) => {
    onClubDataUpdate({ ...clubData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Create Your Club
        </h2>
        <p className="text-gray-600">Set up your football club</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clubName">Club Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="clubName"
              value={clubData.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Enter your club name"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clubType">Club Type</Label>
          <Select
            value={clubData.clubType || ""}
            onValueChange={(value) => updateField("clubType", value)}
          >
            <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
              <SelectValue placeholder="Select club type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="youth-academy">Youth Academy</SelectItem>
              <SelectItem value="amateur-club">Amateur Club</SelectItem>
              <SelectItem value="semi-professional">
                Semi-Professional
              </SelectItem>
              <SelectItem value="professional">Professional Club</SelectItem>
              <SelectItem value="training-center">Training Center</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Club Description</Label>
          <Textarea
            id="description"
            value={clubData.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            placeholder="Tell us about your club's history, mission, and values..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="foundedYear">Founded Year</Label>
            <Input
              id="foundedYear"
              type="number"
              value={clubData.foundedYear || ""}
              onChange={(e) =>
                updateField("foundedYear", parseInt(e.target.value).toString())
              }
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="e.g., 1995"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Member Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={clubData.membershipCapacity || ""}
              onChange={(e) =>
                updateField(
                  "membershipCapacity",
                  parseInt(e.target.value).toString()
                )
              }
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="e.g., 100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Club Website (Optional)</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="website"
              type="url"
              value={clubData.website || ""}
              onChange={(e) => updateField("website", e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="https://yourclub.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clubAddress">Club Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Textarea
              id="clubAddress"
              value={clubData.address || ""}
              onChange={(e) => updateField("address", e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Enter your club's full address..."
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clubPhone">Club Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="clubPhone"
              type="tel"
              value={clubData.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
