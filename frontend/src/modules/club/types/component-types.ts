import { Address } from '@/types/common';

// Club-specific types
export interface CreateClubRequest {
  // Club information
  name: string;
  clubType: 'youth-academy' | 'amateur-club' | 'semi-professional' | 'professional' | 'training-center';
  description?: string;
  foundedYear?: number;
  membershipCapacity?: number;
  website?: string;
  address?: Address | string | null; // Support both new Address object and legacy string
  phone?: string;
  email?: string;
  logoUrl?: string;
}

// Club Setup Component Types
export interface ClubSetupHeaderProps {
  isUpdateMode: boolean;
}

export interface ClubLogoUploadProps {
  clubLogo: string;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface BasicInformationFormProps {
  clubData: Partial<CreateClubRequest>;
  updateField: (
    field: keyof CreateClubRequest,
    value: string | number | undefined
  ) => void;
}

export interface ContactLocationFormProps {
  clubData: Partial<CreateClubRequest>;
  updateField: (
    field: keyof CreateClubRequest,
    value: string | number | Address | null | undefined
  ) => void;
}

export interface ClubSetupActionsProps {
  isUpdateMode: boolean;
  isLoading: boolean;
  isFormValid: boolean;
}

export interface ClubSetupBannerProps {
  hasClubSetup: boolean;
}

// Dashboard Component Types
export interface StatItem {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  joinedDate: string;
  status: string;
  avatar: string;
}

export interface Session {
  id: number;
  title: string;
  time: string;
  date: string;
  participants: number;
  coach: string;
}

export interface Alert {
  id: number;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  time: string;
}
