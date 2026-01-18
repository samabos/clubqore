import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ArrowRight, X, AlertTriangle } from "lucide-react";
import { useOnboarding } from "../../hooks/useOnboarding";
import {
  ProfileSetup,
  ClubSetup,
  PreferencesSetup,
  OnboardingComplete,
} from "./index";

export function OnboardingFlow() {
  const {
    currentStep,
    steps,
    progress,
    isLoading,
    error,
    onboardingData,
    handleNext,
    handleBack,
    canProceed,
    setError,
    updateProfile,
    updatePreferences,
    updateClubData,
  } = useOnboarding();

  const renderStepContent = () => {
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case "profile-setup":
        return (
          <ProfileSetup
            profile={onboardingData.profile}
            onProfileUpdate={updateProfile}
          />
        );
      case "club-setup":
        return (
          <ClubSetup
            clubData={onboardingData.clubData}
            onClubDataUpdate={updateClubData}
          />
        );
      case "preferences-setup":
        return (
          <PreferencesSetup
            preferences={onboardingData.preferences}
            onPreferencesUpdate={updatePreferences}
          />
        );
      case "setup-complete":
        return (
          <OnboardingComplete selectedRole={onboardingData.selectedRole} />
        );
      default:
        return (
          <ProfileSetup
            profile={onboardingData.profile}
            onProfileUpdate={updateProfile}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-2xl rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">CQ</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ClubQore</h1>
                <p className="text-sm text-gray-500">Setup your account</p>
              </div>
            </div>
            <Badge variant="outline" className="rounded-lg">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Error</h4>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="p-1 h-auto hover:bg-red-100 ml-auto"
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          )}

          {renderStepContent()}

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="rounded-xl border-gray-200 hover:border-gray-300 disabled:opacity-50"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="flex-1 rounded-xl gradient-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {currentStep === steps.length - 1
                    ? "Completing..."
                    : "Loading..."}
                </>
              ) : (
                <>
                  {currentStep === steps.length - 1
                    ? "Complete Setup"
                    : "Continue"}
                  {currentStep < steps.length - 1 && !isLoading && (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  )}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
