import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";
import BasicDetailsForm, {
  BasicDetailsData,
} from "@/components/forms/BasicDetailsForm";

interface ParentInformationFormProps {
  formData: BasicDetailsData;
  updateField: (field: keyof BasicDetailsData, value: string) => void;
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
        <BasicDetailsForm
          formData={formData}
          onChange={updateField}
          showEmail={true}
          showAvatar={false}
          emailReadOnly={isEditMode}
          requiredFields={["email", "firstName", "lastName", "phone"]}
          className="space-y-4"
        />
      </CardContent>
    </Card>
  );
}
