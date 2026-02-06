import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { AlertTriangle, Bell, CreditCard, MessageSquare } from "lucide-react";
import { UserPreferences } from "../../types/auth";

interface PreferencesSetupProps {
  preferences: Partial<UserPreferences>;
  onPreferencesUpdate: (preferences: Partial<UserPreferences>) => void;
}

export function PreferencesSetup({
  preferences,
  onPreferencesUpdate,
}: PreferencesSetupProps) {
  const updatePreference = (field: keyof UserPreferences, value: UserPreferences[keyof UserPreferences]) => {
    onPreferencesUpdate({ ...preferences, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Notification Preferences
        </h2>
        <p className="text-gray-600">Choose how you want to receive updates</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Schedule Changes</p>
                <p className="text-sm text-gray-600">
                  Training sessions, matches, and event updates
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.scheduleChanges}
              onChange={(e) =>
                updatePreference("scheduleChanges", e.target.checked)
              }
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Payment Reminders</p>
                <p className="text-sm text-gray-600">
                  Membership fees and payment due dates
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.paymentReminders}
              onChange={(e) =>
                updatePreference("paymentReminders", e.target.checked)
              }
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Emergency Alerts</p>
                <p className="text-sm text-gray-600">
                  Important safety and emergency notifications
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.emergencyAlerts}
              onChange={(e) =>
                updatePreference("emergencyAlerts", e.target.checked)
              }
              className="rounded"
              disabled
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">General Updates</p>
                <p className="text-sm text-gray-600">
                  Club news and general announcements
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.generalUpdates}
              onChange={(e) =>
                updatePreference("generalUpdates", e.target.checked)
              }
              className="rounded"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Privacy Settings</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Profile Visibility</p>
                <p className="text-sm text-gray-600">
                  Who can see your profile information
                </p>
              </div>
              <Select
                value={preferences.profileVisibility}
                onValueChange={(value) =>
                  updatePreference("profileVisibility", value)
                }
              >
                <SelectTrigger className="w-40 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="members_only">Members Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Show Contact Information
                </p>
                <p className="text-sm text-gray-600">
                  Allow others to see your contact details
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.showContactInfo}
                onChange={(e) =>
                  updatePreference("showContactInfo", e.target.checked)
                }
                className="rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
