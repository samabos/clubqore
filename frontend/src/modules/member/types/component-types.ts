// Child data for forms
export interface ChildData {
  id: number;
  childUserId?: number; // The actual child_user_id from the database (used for updates)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  medicalInfo: string;
}

// Define types for parent-child relationships
export interface ChildInfo {
  id: string | number; // child_user_id or generated ID for unregistered children
  name: string;
  firstName: string;
  lastName: string;
  relationship: 'parent' | 'guardian' | 'grandparent' | 'relative' | 'other';
  membershipCode?: string;
  isRegistered: boolean; // true if child has their own account
  dateOfBirth?: string;
  position?: string; // position if child has their own account
}

export interface ParentInfo {
  id: number; // parent_user_id
  name: string;
  relationship: 'parent' | 'guardian' | 'grandparent' | 'relative' | 'other';
  phone?: string;
  accountNumber?: string;
}

// Member types
export interface ClubMember {
  id: number;
  accountId: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  age?: number;
  status: "Active" | "Inactive" | "Pending";
  joinDate: string;
  membershipType: "member" | "parent";
  profileImage?: string;
  accountNumber: string;
  onboardingCompleted: boolean;
  // Team information
  team_id?: number;
  team_name?: string;
  team_color?: string;
  // Parent-child relationships
  children: ChildInfo[];
  parents: ParentInfo[];
  hasChildren: boolean;
  hasParents: boolean;
}

export interface CreateMemberRequest {
  email: string;
  password?: string;
  role: 'member' | 'parent';
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  position?: string;
  parentPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  medicalInfo?: string;
  profileImage?: string;
  generatePassword?: boolean;
  sendWelcomeEmail?: boolean;
  children?: ChildData[]; // For parent registration with children
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  newThisMonth: number;
}

// Component Props Types
export interface MemberHeaderProps {
  clubName?: string;
  onAddMember: () => void;
  onInviteParent?: () => void;
}

export interface MemberStatsProps {
  stats: MemberStats;
}

export interface MemberFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  filterTeam: string;
  onFilterTeamChange: (team: string) => void;
  teams: Array<{ id: number; name: string; color?: string }>;
}

export interface MemberListProps {
  members: ClubMember[];
  onEdit: (memberId: number) => void;
  onAddMember: () => void;
}

export interface RelationshipInfoProps {
  member: ClubMember;
}

// Manage Member Page Types
export interface ManageMemberHeaderProps {
  isEditMode: boolean;
  onBack: () => void;
}

export interface ManageMemberFormProps {
  formData: CreateMemberRequest;
  children: ChildData[];
  isLoading: boolean;
  isEditMode: boolean;
  onFormDataChange: (field: string, value: string | number | boolean) => void;
  onChildFieldChange: (childId: number, field: string, value: string) => void;
  onAddChild: () => void;
  onRemoveChild: (childId: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onEndContract?: () => void;
}

export type ManageMemberLoadingProps = Record<string, never>;

