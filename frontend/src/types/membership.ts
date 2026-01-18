import { AuthUser, ChildInfo, UserPreferences, UserProfile, UserRole } from "./auth";

export interface JoinClubAsMemberRequest {
  clubId: number;
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any';
  experience?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  notes?: string;
  medicalInfo?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}


// Role-specific onboarding requests
export interface CreateClubRequest {
  // Club information
  name: string;
  clubType: 'youth-academy' | 'amateur-club' | 'semi-professional' | 'professional' | 'training-center';
  description?: string;
  foundedYear?: number;
  membershipCapacity?: number;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface SetupParentAccountRequest {
  children: ChildInfo[];
}

export interface OnboardingCompleteRequest {
  // Profile data
  profile: Partial<UserProfile>;
  
  // Preferences
  preferences: Partial<UserPreferences>;
  
  // Role-specific setup
  roleSetup?: {
    role: UserRole;
    clubSetup?: CreateClubRequest;
    memberSetup?: JoinClubAsMemberRequest;
    parentSetup?: SetupParentAccountRequest;
  };
}

export interface OnboardingCompleteResponse {
  message: string;
  user: AuthUser;
}

export interface OnboardingStatusResponse {
  isOnboarded: boolean;
  currentStep: string;
  completedSteps: string[];
  progress: number;
  user: AuthUser;
}


// Updated onboarding API types to match new backend structure
export interface OnboardingStartRequest {
  step?: 'profile' | 'preferences' | 'role';
}

export interface OnboardingStartResponse {
  message: string;
  currentStep: string;
  nextStep: string;
  progress: number;
  user: AuthUser;
}



export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// Club information (from clubs table)
export interface ClubInfo {
  id: string;
  name: string;
  clubType: 'youth-academy' | 'amateur-club' | 'semi-professional' | 'professional' | 'training-center';
  description?: string;
  foundedYear?: number;
  membershipCapacity?: number;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  isActive: boolean;
  verified: boolean;
  createdBy: string;
}