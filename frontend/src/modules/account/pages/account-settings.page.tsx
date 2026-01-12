import { useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChangePasswordForm } from '../components';
import { changePassword } from '../actions';

export function AccountSettingsPage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    setIsChangingPassword(true);
    try {
      await changePassword(data);
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      throw error;
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account security and settings
        </p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          <ChangePasswordForm
            onSubmit={handleChangePassword}
            isLoading={isChangingPassword}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
