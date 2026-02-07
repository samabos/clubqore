import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ProfileForm, PreferencesForm } from '../components';
import {
  fetchProfile,
  fetchPreferences,
  updateProfile,
  updatePreferences,
  UserProfile,
  UpdateProfileRequest
} from '../actions';

// Type for preferences matching backend response
interface UserPreferences {
  scheduleChanges: boolean;
  paymentReminders: boolean;
  emergencyAlerts: boolean;
  generalUpdates: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  profileVisibility: 'public' | 'members_only' | 'private';
  showContactInfo: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Load profile and preferences on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileData, preferencesData] = await Promise.all([
        fetchProfile(),
        fetchPreferences().catch(() => null), // Preferences might not exist yet
      ]);
      setProfile(profileData);
      // Convert nested preferences to flat structure if needed
      if (preferencesData) {
        setPreferences(preferencesData as unknown as UserPreferences);
      } else {
        // Set defaults
        setPreferences({
          scheduleChanges: true,
          paymentReminders: true,
          emergencyAlerts: true,
          generalUpdates: true,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          profileVisibility: 'members_only',
          showContactInfo: false,
          theme: 'auto',
          language: 'en',
        });
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast.error('Failed to load profile', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateProfileRequest) => {
    setIsSavingProfile(true);
    try {
      const updatedProfile = await updateProfile(data);
      setProfile(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      throw error;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePreferences = async (data: UserPreferences) => {
    setIsSavingPreferences(true);
    try {
      const updatedPreferences = await updatePreferences(data as unknown as Parameters<typeof updatePreferences>[0]);
      setPreferences(updatedPreferences as unknown as UserPreferences);
      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to save preferences', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      throw error;
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!profile || !preferences) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Unable to load profile
          </h2>
          <p className="text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileForm
            profile={profile}
            onSubmit={handleUpdateProfile}
            isLoading={isSavingProfile}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesForm
            preferences={preferences}
            onSubmit={handleUpdatePreferences}
            isLoading={isSavingPreferences}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
