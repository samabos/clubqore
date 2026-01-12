import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Flat preferences structure matching backend
interface PreferencesFormData {
  // Notifications
  scheduleChanges: boolean;
  paymentReminders: boolean;
  emergencyAlerts: boolean;
  generalUpdates: boolean;
  // Communication
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  // Privacy
  profileVisibility: 'public' | 'members_only' | 'private';
  showContactInfo: boolean;
  // UI
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

interface PreferencesFormProps {
  preferences: PreferencesFormData;
  onSubmit: (data: PreferencesFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PreferencesForm({ preferences, onSubmit, isLoading }: PreferencesFormProps) {
  const form = useForm<PreferencesFormData>({
    defaultValues: {
      scheduleChanges: preferences.scheduleChanges ?? true,
      paymentReminders: preferences.paymentReminders ?? true,
      emergencyAlerts: preferences.emergencyAlerts ?? true,
      generalUpdates: preferences.generalUpdates ?? true,
      emailNotifications: preferences.emailNotifications ?? true,
      smsNotifications: preferences.smsNotifications ?? false,
      pushNotifications: preferences.pushNotifications ?? true,
      profileVisibility: preferences.profileVisibility ?? 'members_only',
      showContactInfo: preferences.showContactInfo ?? false,
      theme: preferences.theme ?? 'auto',
      language: preferences.language ?? 'en',
    },
  });

  const handleSubmit = async (data: PreferencesFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="scheduleChanges"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Schedule Changes</FormLabel>
                    <FormDescription>
                      Get notified about changes to training sessions and events
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentReminders"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Payment Reminders</FormLabel>
                    <FormDescription>
                      Receive reminders about upcoming and overdue payments
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyAlerts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Emergency Alerts</FormLabel>
                    <FormDescription>
                      Receive urgent notifications (always recommended)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generalUpdates"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">General Updates</FormLabel>
                    <FormDescription>
                      News, announcements, and general club information
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Communication Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Channels</CardTitle>
            <CardDescription>
              How would you like to receive notifications?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications via email
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="smsNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">SMS Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications via text message
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pushNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Push Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications in your browser or app
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control who can see your information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="profileVisibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="members_only">Members Only - Only club members can view</SelectItem>
                      <SelectItem value="private">Private - Only you can view</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose who can see your profile information
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showContactInfo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Contact Information</FormLabel>
                    <FormDescription>
                      Allow others to see your email and phone number
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose your preferred color theme
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose your preferred language
                  </FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
