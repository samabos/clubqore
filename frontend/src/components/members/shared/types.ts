export interface MemberProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  profileImage?: string;
  
  // Club Information
  clubId: string;
  clubName: string;
  position: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation?: string;
  
  // Additional Information
  medicalConditions?: string;
  notes?: string;
  
  // System Information
  status: 'active' | 'inactive' | 'pending';
  joinDate: Date;
  membershipType: 'member' | 'parent';
}

export interface ParentProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  
  // Address Information
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // System Information
  status: 'active' | 'inactive' | 'pending';
  joinDate: Date;
  
  // Related Members
  children: string[]; // Member IDs
}

export interface InvitationData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  clubId: string; // Automatically set from logged-in user's club
  clubName: string; // Automatically set from logged-in user's club
  invitedBy: string; // Club manager ID
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  registrationUrl: string;
  
  // Pre-filled data for the invitation (recipient chooses role during registration)
  preFilledData?: {
    firstName?: string;
    lastName?: string;
    clubId?: string; // Pre-filled from user's club
    clubName?: string; // Pre-filled from user's club
  };
}

export interface RegistrationFormData {
  type: 'member' | 'parent'; // Chosen by the recipient during registration
  profile: MemberProfile | ParentProfile;
  invitationId?: string; // If this is from an invitation
  createdBy?: string; // If registered directly by club manager
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type MembershipType = 'member' | 'parent';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

// Filter types for UI components
export type InvitationFilterStatus = 'all' | 'pending' | 'accepted' | 'expired' | 'cancelled';
export type MemberFilterType = 'all' | 'member' | 'parent';
export type MemberFilterStatus = 'all' | 'active' | 'inactive' | 'pending';

// Enhanced Direct Registration Types
export interface DirectRegistrationData {
  registrationType: 'member' | 'parent';
  memberInfo?: {
    email: string;
    isExisting: boolean;
    existingMemberId?: string;
  };
  parentInfo?: {
    email: string;
    isExisting: boolean;
    existingParentId?: string;
  };
  children?: Array<{
    formData: any;
    tempId: string;
  }>;
}
