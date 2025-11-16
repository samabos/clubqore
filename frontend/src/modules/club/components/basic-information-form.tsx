import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { BasicInformationFormProps } from "../types/component-types";

export function BasicInformationForm({
  clubData,
  updateField,
}: BasicInformationFormProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
        Basic Information
      </h3>

      <div className="space-y-2">
        <Label htmlFor="clubName" className="text-sm font-medium text-gray-700">
          Club Name *
        </Label>
        <Input
          id="clubName"
          value={clubData.name || ""}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Enter your club name"
          className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clubType" className="text-sm font-medium text-gray-700">
          Club Type *
        </Label>
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
            <SelectItem value="semi-professional">Semi-Professional</SelectItem>
            <SelectItem value="professional">Professional Club</SelectItem>
            <SelectItem value="training-center">Training Center</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-sm font-medium text-gray-700"
        >
          Club Description *
        </Label>
        <Textarea
          id="description"
          value={clubData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Tell us about your club's history, mission, and values..."
          rows={4}
          className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            value={clubData.foundedYear || ""}
            onChange={(e) =>
              updateField(
                "foundedYear",
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="e.g., 1995"
            className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="capacity"
            className="text-sm font-medium text-gray-700"
          >
            Member Capacity
          </Label>
          <Input
            id="capacity"
            type="number"
            value={clubData.membershipCapacity || ""}
            onChange={(e) =>
              updateField(
                "membershipCapacity",
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="e.g., 100"
            className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website" className="text-sm font-medium text-gray-700">
          Club Website
        </Label>
        <Input
          id="website"
          type="url"
          value={clubData.website || ""}
          onChange={(e) => updateField("website", e.target.value)}
          placeholder="https://yourclub.com"
          className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Club Email
        </Label>
        <Input
          id="email"
          type="email"
          value={clubData.email || ""}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="contact@yourclub.com"
          className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
