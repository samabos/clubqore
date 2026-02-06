// Re-export UserRole from auth.ts for backward compatibility
export type { UserRole } from './auth';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  link?: string;
  children?: MenuItem[];
  /** Resource name for scope-based permission checking (e.g., 'parent-dashboard', 'billing') */
  resource?: string;
  /** Sort order from database resources table */
  sortOrder?: number;
}