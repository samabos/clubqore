import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Baby, Plus, X } from "lucide-react";
import { ChildInfo } from "@/types/auth";
import { SetupParentAccountRequest } from "@/types/membership";

interface ParentSetupProps {
  parentData: Partial<SetupParentAccountRequest>;
  onParentDataUpdate: (parentData: Partial<SetupParentAccountRequest>) => void;
}

export function ParentSetup({
  parentData,
  onParentDataUpdate,
}: ParentSetupProps) {
  const addChild = () => {
    const currentChildren = parentData.children || [];
    onParentDataUpdate({
      ...parentData,
      children: [
        ...currentChildren,
        {
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          sex: "male",
        },
      ],
    });
  };

  const removeChild = (index: number) => {
    const currentChildren = parentData.children || [];
    onParentDataUpdate({
      ...parentData,
      children: currentChildren.filter((_, i) => i !== index),
    });
  };

  const updateChild = (
    index: number,
    field: keyof ChildInfo,
    value: string
  ) => {
    const currentChildren = parentData.children || [];
    const updatedChildren = currentChildren.map((child, i) =>
      i === index ? { ...child, [field]: value } : child
    );
    onParentDataUpdate({
      ...parentData,
      children: updatedChildren,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Children Information
        </h2>
        <p className="text-gray-600">
          Add your children who participate in football activities
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Children Information</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChild}
            className="rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Child
          </Button>
        </div>

        {parentData.children?.map((child, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Child {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeChild(index)}
                className="p-1 h-auto hover:bg-red-50 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="First name"
                value={child.firstName}
                onChange={(e) =>
                  updateChild(index, "firstName", e.target.value)
                }
                className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20"
                required
              />
              <Input
                placeholder="Last name"
                value={child.lastName}
                onChange={(e) => updateChild(index, "lastName", e.target.value)}
                className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <Input
              type="date"
              placeholder="Date of birth"
              value={child.dateOfBirth}
              onChange={(e) =>
                updateChild(index, "dateOfBirth", e.target.value)
              }
              className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20"
              required
            />

            <div className="space-y-2">
              <Label htmlFor={`sex-${index}`}>Sex</Label>
              <Select
                value={child.sex}
                onValueChange={(value) => updateChild(index, "sex", value)}
              >
                <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="Select Sex" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Club ID (optional)"
                value={child.clubId || ""}
                onChange={(e) => updateChild(index, "clubId", e.target.value)}
                className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20"
              />
              <Input
                placeholder="Membership code (optional)"
                value={child.membershipCode || ""}
                onChange={(e) =>
                  updateChild(index, "membershipCode", e.target.value)
                }
                className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>
        ))}

        {(parentData.children?.length || 0) === 0 && (
          <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
            <Baby className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Add your children to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
