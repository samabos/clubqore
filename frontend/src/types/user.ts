export type UserRole = 'admin' | 'club_manager' | 'member' | 'parent' | 'staff' | 'team_manager' | 'super_admin';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  link?: string;
  children?: MenuItem[];
  /** Resource name for scope-based permission checking (e.g., 'parent-dashboard', 'billing') */
  resource?: string;
}