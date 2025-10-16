import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormItem } from "@/components/ui/form";
import { User } from "lucide-react";

interface ParentInformationFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  updateField: (field: string, value: string) => void;
  isEditMode?: boolean;
}

export default function ParentInformationForm({
  formData,
  updateField,
  isEditMode = false,
}: ParentInformationFormProps) {
  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5" />
          Parent Information
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update the parent's basic details and account information"
            : "Enter the parent's basic details and account information (parent will receive login credentials)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
            />
          </FormItem>
          <FormItem>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
            />
          </FormItem>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
              disabled={isEditMode} // Email usually can't be changed after creation
            />
          </FormItem>
          <FormItem>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              required
            />
          </FormItem>
        </div>
      </CardContent>
    </Card>
  );
}
