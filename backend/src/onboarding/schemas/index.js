// Export all onboarding schemas
export { onboardingSchemas } from './onboardingSchemas.js';
export { profileSchemas } from './profileSchemas.js';
export { createTeamSchema, updateTeamSchema, assignManagerSchema, assignMemberSchema } from './teamSchemas.js';

// Combined schema definitions for easy reference
export const allSchemas = {
  onboarding: {
    completeOnboarding: 'onboardingSchemas.completeOnboarding',
    addRole: 'onboardingSchemas.addRole',
    setPrimaryRole: 'onboardingSchemas.setPrimaryRole',
    updateProgress: 'onboardingSchemas.updateProgress'
  },
  profile: {
    updateProfile: 'profileSchemas.updateProfile',
    updatePreferences: 'profileSchemas.updatePreferences',
    uploadAvatar: 'profileSchemas.uploadAvatar',
    addChild: 'profileSchemas.addChild'
  }
};
