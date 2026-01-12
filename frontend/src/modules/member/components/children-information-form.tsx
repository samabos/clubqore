import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, UserPlus } from "lucide-react";

export interface ChildData {
  id: number;
  childUserId?: number; // The actual child_user_id from the database (used for updates)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  medicalInfo: string;
}

interface ChildrenInformationFormProps {
  children: ChildData[];
  updateChildField: (childId: number, field: string, value: string) => void;
  addChild: () => void;
  removeChild: (childId: number) => void;
  isEditMode?: boolean;
}

export default function ChildrenInformationForm({
  children,
  updateChildField,
  addChild,
  removeChild,
  isEditMode = false,
}: ChildrenInformationFormProps) {
  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Players Information
            </CardTitle>
            <CardDescription>
              {isEditMode
                ? "Update the players' information (players don't get separate login accounts)"
                : "Add the players who will be club members (players don't get separate login accounts)"}
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={addChild}
            variant="outline"
            className="rounded-xl"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {children.map((child, index) => (
          <div key={child.id} className="border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Player {index + 1}</h3>
              {children.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeChild(child.id)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <Label htmlFor={`child-${child.id}-firstName`}>
                  First Name *
                </Label>
                <Input
                  id={`child-${child.id}-firstName`}
                  value={child.firstName}
                  onChange={(e) =>
                    updateChildField(child.id, "firstName", e.target.value)
                  }
                  required
                />
              </FormItem>
              <FormItem>
                <Label htmlFor={`child-${child.id}-lastName`}>
                  Last Name *
                </Label>
                <Input
                  id={`child-${child.id}-lastName`}
                  value={child.lastName}
                  onChange={(e) =>
                    updateChildField(child.id, "lastName", e.target.value)
                  }
                  required
                />
              </FormItem>
              <FormItem>
                <Label htmlFor={`child-${child.id}-dateOfBirth`}>
                  Date of Birth *
                </Label>
                <Input
                  id={`child-${child.id}-dateOfBirth`}
                  type="date"
                  value={child.dateOfBirth}
                  onChange={(e) =>
                    updateChildField(child.id, "dateOfBirth", e.target.value)
                  }
                  required
                />
              </FormItem>
              <FormItem>
                <Label htmlFor={`child-${child.id}-position`}>Position</Label>
                <Select
                  value={child.position}
                  onValueChange={(value) =>
                    updateChildField(child.id, "position", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="Defender">Defender</SelectItem>
                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                    <SelectItem value="Winger">Winger</SelectItem>
                    <SelectItem value="Striker">Striker</SelectItem>
                    <SelectItem value="Center Back">Center Back</SelectItem>
                    <SelectItem value="Full Back">Full Back</SelectItem>
                    <SelectItem value="Defensive Midfielder">
                      Defensive Midfielder
                    </SelectItem>
                    <SelectItem value="Attacking Midfielder">
                      Attacking Midfielder
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>

              <FormItem>
                <Label htmlFor={`child-${child.id}-medicalInfo`}>
                  Medical Conditions / Allergies
                </Label>
                <Input
                  id={`child-${child.id}-medicalInfo`}
                  value={child.medicalInfo}
                  onChange={(e) =>
                    updateChildField(child.id, "medicalInfo", e.target.value)
                  }
                  placeholder="e.g., Asthma, Peanut allergy, etc."
                />
              </FormItem>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
