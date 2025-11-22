// Personnel-specific types
export interface Personnel {
  userRoleId: number;
  userId: number;
  role: string;
  clubId: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  avatar: string;
  isOnboarded: boolean;
  roleCreatedAt: string;
  certificationLevel?: string;
  yearsOfExperience?: number;
  bio?: string;
  dateOfBirth?: string;
}

export interface PersonnelFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  role?: 'team_manager' | 'staff';
  certificationLevel?: string;
  yearsOfExperience?: number;
  bio?: string;
  dateOfBirth?: string;
  sendLoginEmail?: boolean;
}

export interface PersonnelFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PersonnelFormData;
  onFormDataChange: (data: PersonnelFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEdit?: boolean;
}

export interface PersonnelTableProps {
  personnel: Personnel[];
  loading: boolean;
  onEdit: (person: Personnel) => void;
  onDelete: (userRoleId: number) => void;
  onAddNew: () => void;
}
