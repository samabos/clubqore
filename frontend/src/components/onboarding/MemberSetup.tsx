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
import { Code } from "lucide-react";
import { JoinClubAsMemberRequest } from "../../types/membership";

interface MemberSetupProps {
  memberData: Partial<JoinClubAsMemberRequest>;
  onMemberDataUpdate: (memberData: Partial<JoinClubAsMemberRequest>) => void;
}

export function MemberSetup({
  memberData,
  onMemberDataUpdate,
}: MemberSetupProps) {
  const updateField = (field: keyof JoinClubAsMemberRequest, value: string) => {
    onMemberDataUpdate({ ...memberData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Join a Club</h2>
        <p className="text-gray-600">Complete your member profile</p>
      </div>

      <div className="space-y-4">
        {/* Club Invite Code */}
        <div className="space-y-2">
          <Label htmlFor="clubInviteCode">Club Invite Code</Label>
          <div className="relative">
            <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="clubInviteCode"
              value={memberData.clubInviteCode || ""}
              onChange={(e) => updateField("clubInviteCode", e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Enter invite code from your club"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            Get this code from your club manager to join the team.
          </p>
        </div>

        {/* Preferred Position */}
        <div className="space-y-2">
          <Label htmlFor="position">Preferred Position</Label>
          <Select
            value={memberData.position || ""}
            onValueChange={(value) => updateField("position", value)}
          >
            <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
              <SelectValue placeholder="Select your preferred position" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
              <SelectItem value="defender">Defender</SelectItem>
              <SelectItem value="midfielder">Midfielder</SelectItem>
              <SelectItem value="forward">Forward</SelectItem>
              <SelectItem value="any">Any Position</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <Label htmlFor="experience">Football Experience</Label>
          <Select
            value={memberData.experience || ""}
            onValueChange={(value) => updateField("experience", value)}
          >
            <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
              <SelectItem value="intermediate">
                Intermediate (2-5 years)
              </SelectItem>
              <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Medical Information */}
        <div className="space-y-2">
          <Label htmlFor="medicalInfo">Medical Information (Optional)</Label>
          <Textarea
            id="medicalInfo"
            value={memberData.medicalInfo || ""}
            onChange={(e) => updateField("medicalInfo", e.target.value)}
            className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            placeholder="Any medical information, allergies, or special requirements..."
            rows={3}
          />
        </div>

        {/* Emergency Contact Name */}
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
          <Input
            id="emergencyContactName"
            value={memberData.emergencyContactName || ""}
            onChange={(e) =>
              updateField("emergencyContactName", e.target.value)
            }
            className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            placeholder="Full name of emergency contact"
          />
        </div>

        {/* Emergency Contact Phone */}
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
          <Input
            id="emergencyContactPhone"
            value={memberData.emergencyContactPhone || ""}
            onChange={(e) =>
              updateField("emergencyContactPhone", e.target.value)
            }
            className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            placeholder="Phone number of emergency contact"
          />
        </div>

        {/* Emergency Contact Relation */}
        <div className="space-y-2">
          <Label htmlFor="emergencyContactRelation">
            Emergency Contact Relation
          </Label>
          <Input
            id="emergencyContactRelation"
            value={memberData.emergencyContactRelation || ""}
            onChange={(e) =>
              updateField("emergencyContactRelation", e.target.value)
            }
            className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            placeholder="Relationship to emergency contact"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={memberData.notes || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            placeholder="Any additional notes..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
