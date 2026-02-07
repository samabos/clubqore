import { Address } from "./common"
import { ClubInfo } from "./membership"

export type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'reset-password' | 'email-verification';
export type AccountType = 'club' | 'member' | 'parent';
export type UserRole = 'admin' | 'club_manager' | 'member' | 'parent' | 'staff' | 'team_manager' | 'super_admin';

// Updated to match new backend schema
export interface AuthUser {
  id: string;
  email: string;
  isOnboarded: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  onboardingCompletedAt?: string;
  created_at?: string;
  updated_at?: string;
  clubId?: number;

  // UI helpers
  name?: string;
  initials?: string;
  avatar?: string;

  // Related data loaded from normalized tables
  profile?: UserProfile;
  preferences?: UserPreferences;
  roles: string[];
  primaryRole?: UserRole;
  accounts?: UserAccount[];
  children?: UserChild[];
}

// User profile information (from user_profiles table)
export interface UserProfile extends ChildInfo {
  fullName?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  profileCompletedAt?: string;
  address?: Address;
}

export interface ChildInfo {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female';
  clubId?: string;
  notes?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any';
  membershipCode?: string;
  medicalConditions?: string;
  profileImage?: string;
}

// User preferences (from user_preferences table)
export interface UserPreferences {
  // Notification preferences
  scheduleChanges: boolean;
  paymentReminders: boolean;
  emergencyAlerts: boolean;
  generalUpdates: boolean;
  
  // Communication preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  
  // Privacy settings
  profileVisibility: 'public' | 'members_only' | 'private';
  showContactInfo: boolean;
  
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

// User role information (from user_roles table)
export interface UserRoleInfo {
  role: UserRole;
  isActive: boolean;
  clubId?: string;
  parentUserId?: string;
  //roleData?: any;
  assignedAt: string;
  assignedBy?: string;
}

// User account information (from user_accounts table)
export interface UserAccount {
  id: string;
  accountNumber: string;
  role: UserRole;
  clubId?: string;
  
  // Member-specific data
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any';
  experience?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  parentName?: string;
  parentPhone?: string;
  
  isActive: boolean;
  onboardingCompletedAt?: string;
  
  // Related club information
  club?: ClubInfo;
}

// Children information (from user_children table)
export interface UserChild extends ChildInfo {
  id: string;
  childUserId?: string; // If child has their own account
  
  
  // Related data
  childUser?: AuthUser; // If child has account
  club?: ClubInfo;
}



export interface SimpleSignUpData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ClubManagerSignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  clubName: string;
  clubAddress: string | Address;
}

export interface RegistrationSuccessResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    email: string;
    emailVerified: boolean;
  };
}

export interface SignInData {
  email: string;
  password: string;
}



export interface GoogleAuthResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Role management types
export interface UserRolesResponse {
  roles: UserRole[];
  primaryRole: UserRole;
  availableRoles: UserRole[];
}

export interface UpdateRoleRequest {
  primaryRole: UserRole;
}

export interface AssignRoleRequest {
  userId: number;
  role: UserRole;
}