import { UserRole } from "../types/user";
import {
  Dashboard,
  AdminDashboard,
  SuperAdminDashboard,
  MemberDashboard,
  ParentDashboard,
} from "../modules/dashboard";
import { ClubManagerDashboard } from "../modules/club/pages/club-manager-dashboard.page";
import { MemberRegistration } from "../components/MemberRegistration";
import { ClubManagement } from "../components/ClubManagement";
import { BillingPayments } from "../components/BillingPayments";
import { ClubBilling } from "../components/ClubBilling";
import { Communication } from "../components/Communication";
import { CalendarView } from "../components/CalendarView";
import { AttendanceTracking } from "../components/AttendanceTracking";
import { ParentModule } from "../components/ParentModule";
import { ProfileManagement } from "../components/ProfileManagement";

export const renderContent = (activeView: string, userRole: UserRole) => {
  // Role-specific dashboard rendering
  if (activeView === "dashboard") {
    switch (userRole) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'admin':
        return <Dashboard />;
      case 'club_manager':
        return <ClubManagerDashboard />;
      case 'member':
        return <MemberDashboard />;
      case 'parent':
        return <ParentDashboard />;
      default:
        return <Dashboard />;
    }
  }

  // Other view rendering based on role permissions
  switch (activeView) {
    case "members":
      return <MemberRegistration />;
    case "clubs":
      return userRole === 'admin' ? <ClubManagement /> : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this section.</p>
          </div>
        </div>
      );
    case "billing":
      return userRole === 'admin' ? <BillingPayments /> : <ClubBilling />;
    case "communication":
      return <Communication />;
    case "calendar":
      return <CalendarView />;
    case "attendance":
      return <AttendanceTracking />;
    case "parent":
      return userRole === 'admin' ? <ParentModule /> : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this section.</p>
          </div>
        </div>
      );
    case "children":
      // Parent-specific view for managing children
      return userRole === 'parent' ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Children</h1>
            <p className="text-gray-600">Manage and monitor your children's football activities.</p>
          </div>
          {/* This would be a dedicated children management component */}
          <ParentDashboard />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">Only parents can access this section.</p>
          </div>
        </div>
      );
    case "profile":
      return <ProfileManagement />;
    default:
      return userRole === 'super_admin' ? <SuperAdminDashboard /> :
             userRole === 'admin' ? <Dashboard /> :
             userRole === 'club_manager' ? <ClubManagerDashboard /> :
             userRole === 'member' ? <MemberDashboard /> :
             <ParentDashboard />;
  }
};