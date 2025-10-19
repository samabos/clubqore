import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { teamManagersAPI } from '@/api/teamManagers';
import { CreateTeamManagerRequest, CreateTeamManagerResponse } from '@/types/teamManager';
import { Check, Copy, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateTeamManagerFormProps {
  clubId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateTeamManagerForm: React.FC<CreateTeamManagerFormProps> = ({
  clubId,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdTeamManager, setCreatedTeamManager] = useState<CreateTeamManagerResponse | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateTeamManagerRequest>({
    defaultValues: {
      sendLoginEmail: true,
    },
  });

  const sendLoginEmail = watch('sendLoginEmail');

  const onSubmit = async (data: CreateTeamManagerRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await teamManagersAPI.createTeamManager(clubId, data);
      
      setCreatedTeamManager(result);
      setShowSuccessDialog(true);
      reset();

      toast.success('Team manager created successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create team manager';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (createdTeamManager?.temporaryPassword) {
      navigator.clipboard.writeText(createdTeamManager.temporaryPassword);
      setCopiedPassword(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopiedPassword(false), 3000);
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setCreatedTeamManager(null);
    setCopiedPassword(false);
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Team Manager Account</CardTitle>
          <CardDescription>
            Add a new coach or team manager to your club. They will receive login credentials via email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...register('firstName', { required: 'First name is required' })}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...register('lastName', { required: 'Last name is required' })}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                />
              </div>
            </div>

            {/* Coach-Specific Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Coach Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization/Position</Label>
                <Input
                  id="specialization"
                  {...register('specialization')}
                  placeholder="e.g., Head Coach, Assistant Coach, Goalkeeper Coach"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificationLevel">Certification Level</Label>
                  <Input
                    id="certificationLevel"
                    {...register('certificationLevel')}
                    placeholder="e.g., UEFA A License, Level 3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    {...register('yearsOfExperience', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Must be 0 or greater' },
                    })}
                    placeholder="5"
                  />
                  {errors.yearsOfExperience && (
                    <p className="text-sm text-red-500">{errors.yearsOfExperience.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio/Description</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Brief description of coaching experience and qualifications..."
                  rows={4}
                />
              </div>
            </div>

            {/* Email Notification Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Settings</h3>
              
              <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="sendLoginEmail" className="text-base">
                    Send Login Credentials Email
                  </Label>
                  <p className="text-sm text-gray-500">
                    Automatically send welcome email with login credentials to the team manager
                  </p>
                </div>
                <Switch
                  id="sendLoginEmail"
                  {...register('sendLoginEmail')}
                  defaultChecked={true}
                />
              </div>

              {!sendLoginEmail && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    You will need to manually share the temporary password with the team manager after creation.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Form Actions */}
            <DialogFooter className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Team Manager'
                )}
              </Button>
            </DialogFooter>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              Team Manager Created Successfully!
            </DialogTitle>
            <DialogDescription>
              The team manager account has been created and {createdTeamManager?.emailSent ? 'login credentials have been sent via email' : 'is ready to use'}.
            </DialogDescription>
          </DialogHeader>

          {createdTeamManager && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-base font-semibold">{createdTeamManager.teamManager.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{createdTeamManager.teamManager.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Number</p>
                  <p className="text-base font-mono">{createdTeamManager.teamManager.accountNumber}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Temporary Password</p>
                    <p className="text-xs text-yellow-700 mb-2">
                      This password will only be shown once. Make sure to copy it now.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                        {createdTeamManager.temporaryPassword}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyPassword}
                        className="shrink-0"
                      >
                        {copiedPassword ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {createdTeamManager.emailSent && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    A welcome email with login instructions has been sent to {createdTeamManager.teamManager.email}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCloseSuccessDialog}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
