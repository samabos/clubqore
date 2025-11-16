import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormItem } from "@/components/ui/form";
import { Key } from "lucide-react";

interface AccountSettingsFormProps {
  formData: {
    password: string;
    generatePassword: boolean;
    sendWelcomeEmail: boolean;
  };
  updateField: (field: string, value: string | boolean) => void;
  isEditMode?: boolean;
}

export default function AccountSettingsForm({
  formData,
  updateField,
  isEditMode = false,
}: AccountSettingsFormProps) {
  // In edit mode, we might not want to show password generation options
  if (isEditMode) {
    return (
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Update account settings (password changes require separate process)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To change the password, please use the
              "Reset Password" feature or contact the club administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Account Settings
        </CardTitle>
        <CardDescription>
          Configure the member's account and login credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="generatePassword"
            checked={formData.generatePassword}
            onCheckedChange={(checked) =>
              updateField("generatePassword", checked)
            }
          />
          <Label htmlFor="generatePassword">Generate random password</Label>
        </div>

        {!formData.generatePassword && (
          <FormItem>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
            />
          </FormItem>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendWelcomeEmail"
            checked={formData.sendWelcomeEmail}
            onCheckedChange={(checked) =>
              updateField("sendWelcomeEmail", checked)
            }
          />
          <Label htmlFor="sendWelcomeEmail">
            Send welcome email with login details
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
