// Dashboard Module Exports

// Pages - All role-based dashboards
export { Dashboard } from './pages/Dashboard';
export { AdminDashboard } from './pages/AdminDashboard';
export { SuperAdminDashboard } from './pages/SuperAdminDashboard';
export { MemberDashboard } from './pages/MemberDashboard';
export { ParentDashboard } from './pages/ParentDashboard';

// Components
export { EventCard } from './components/EventCard';
export type { EventCardProps } from './components/EventCard';

// Actions
export {
  fetchParentDashboardData,
  fetchChildDashboardData
} from './actions/parent-dashboard-actions';

// Types
export type {
  ParentDashboardData,
  DashboardEvent,
  DashboardStats
} from './types';

// Utils
export {
  combineAndSortEvents,
  getInvoiceStatusVariant
} from './utils/dashboard-utils';
