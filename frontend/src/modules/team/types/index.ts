export interface Team {
  id: number;
  club_id: number;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  manager_count?: number;
  member_count?: number;
  manager_id?: number;
  manager_first_name?: string;
  manager_last_name?: string;
  manager_email?: string;
  manager_avatar?: string;
}

export interface TeamManager {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: number;
  user_id: number;
  team_id: number;
  account_number: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  avatar?: string;
  phone?: string | null;
  assigned_at?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  status?: string;
}

export interface TeamWithDetails extends Team {
  managers: TeamManager[];
  members: TeamMember[];
}

export interface CreateTeamRequest {
  name: string;
  color?: string;
  is_active?: boolean;
  manager_id?: number | null;
}

export interface UpdateTeamRequest {
  name?: string;
  color?: string;
  is_active?: boolean;
  manager_id?: number | null;
}

export interface AssignManagerRequest {
  userId: number;
}

export interface AssignMemberRequest {
  memberId: number;
}
