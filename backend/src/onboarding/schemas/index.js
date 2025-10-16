// Export all onboarding schemas
export { onboardingSchemas } from './onboardingSchemas.js';
export { profileSchemas } from './profileSchemas.js';
export { clubSchemas } from './clubSchemas.js';
export { inviteSchemas, accountSchemas, commonPatterns } from './inviteAccountSchemas.js';

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
  },
  club: {
    updateClub: 'clubSchemas.updateClub',
    searchClubs: 'clubSchemas.searchClubs',
    createInviteCode: 'clubSchemas.createInviteCode',
    browseClubs: 'clubSchemas.browseClubs'
  },
  invite: {
    validateInviteCode: 'inviteSchemas.validateInviteCode',
    previewInviteCode: 'inviteSchemas.previewInviteCode'
  },
  account: {
    generateAccountNumber: 'accountSchemas.generateAccountNumber',
    searchAccounts: 'accountSchemas.searchAccounts'
  }
};
