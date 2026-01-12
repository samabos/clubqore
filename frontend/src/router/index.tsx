import { createBrowserRouter, Navigate } from "react-router-dom";
import { LandingPage } from "../components/home";
import { Authentication } from "../modules/authentication";
import { OnboardingWrapper } from "../components/onboarding/OnboardingWrapper";
import { EmailVerificationCallback } from "../components/EmailVerificationCallback";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { RoleBasedRedirect } from "../components/RoleBasedRedirect";
import {
  Dashboard,
  AdminDashboard,
  SuperAdminDashboard,
  MemberDashboard,
  ParentDashboard,
} from "../modules/dashboard";
import { ClubManagerDashboard, ClubSetupPage } from "../modules/club/pages";
import {
  TeamManagementPage,
  TeamDetailsPage,
  TeamEditPage,
} from "../modules/team";
import { PersonnelManagementPage } from "../modules/personnel/pages";
import { ClubMemberPage, ManageMemberPage } from "../modules/member/pages";
import { SeasonManagementPage } from "../modules/season/pages/season-management.page";
import { ScheduleManagementPage } from "../modules/schedule/pages/schedule-management.page";
import {
  BillingManagementPage,
  InvoiceDetailPage,
  BillingSettingsPage,
  ParentBillingPage,
  ParentInvoiceDetailPage,
  AdminBillingSettingsPage,
} from "../modules/billing/pages";
import {
  ResourceManagementPage,
  PermissionManagementPage,
} from "../modules/admin";
import { MyChildrenPage, ChildDetailPage, ParentSchedulePage } from "../modules/parent/pages";
import { ProfileSettingsPage } from "../modules/profile";
import { AccountSettingsPage } from "../modules/account";
import { ParentModule } from "../components/ParentModule";
import { AppLayout } from "../components/layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { MembersLayout } from "../components/members";
import { ScopeProtectedRoute } from "../components/ScopeProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <Authentication />,
  },
  {
    path: "/verify-email",
    element: <EmailVerificationCallback />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingWrapper />
      </ProtectedRoute>
    ),
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RoleBasedRedirect />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "admin-dashboard",
        element: (
          <ScopeProtectedRoute resource="admin-dashboard">
            <AdminDashboard />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "member-dashboard",
        element: (
          <ScopeProtectedRoute resource="member-dashboard">
            <MemberDashboard />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "parent-dashboard",
        element: (
          <ScopeProtectedRoute resource="parent-dashboard">
            <ParentDashboard />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "club-manager-dashboard",
        element: (
          <ScopeProtectedRoute resource="club-manager-dashboard">
            <ClubManagerDashboard />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "staff-dashboard",
        element: (
          <ScopeProtectedRoute resource="staff-dashboard">
            <LandingPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "team-manager-dashboard",
        element: (
          <ScopeProtectedRoute resource="team-manager-dashboard">
            <LandingPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "super-admin-dashboard",
        element: (
          <ScopeProtectedRoute resource="super-admin-dashboard">
            <SuperAdminDashboard />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "admin",
        children: [
          {
            path: "clubs",
            element: (
              <ScopeProtectedRoute resource="admin-clubs">
                <div className="p-6"><h1 className="text-2xl font-bold">Club Management</h1><p className="text-gray-500 mt-4">Coming Soon...</p></div>
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "clubs/approvals",
            element: (
              <ScopeProtectedRoute resource="admin-club-approvals">
                <div className="p-6"><h1 className="text-2xl font-bold">Club Approvals</h1><p className="text-gray-500 mt-4">Coming Soon...</p></div>
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "billing/settings",
            element: (
              <ScopeProtectedRoute resource="admin-billing-settings">
                <AdminBillingSettingsPage />
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "billing/jobs",
            element: (
              <ScopeProtectedRoute resource="admin-billing-jobs">
                <div className="p-6"><h1 className="text-2xl font-bold">Scheduled Invoice Jobs</h1><p className="text-gray-500 mt-4">Coming Soon...</p></div>
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "analytics",
            element: (
              <ScopeProtectedRoute resource="admin-analytics">
                <div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-gray-500 mt-4">Coming Soon...</p></div>
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "audit-logs",
            element: (
              <ScopeProtectedRoute resource="admin-audit-logs">
                <div className="p-6"><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-gray-500 mt-4">Coming Soon...</p></div>
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "settings",
            element: (
              <ScopeProtectedRoute resource="admin-settings">
                <div className="p-6"><h1 className="text-2xl font-bold">Platform Settings</h1><p className="text-gray-500 mt-4">Coming Soon...</p></div>
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "resources",
            element: (
              <ScopeProtectedRoute resource="admin-resources">
                <ResourceManagementPage />
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "permissions",
            element: (
              <ScopeProtectedRoute resource="admin-permissions">
                <PermissionManagementPage />
              </ScopeProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "parent",
        element: <ParentModule />,
      },
      {
        path: "members",
        element: (
          <ScopeProtectedRoute resource="member-management">
            <MembersLayout />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "club/setup",
        element: (
          <ScopeProtectedRoute resource="club-setup">
            <ClubSetupPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "club/personnel",
        element: (
          <ScopeProtectedRoute resource="club-personnel">
            <PersonnelManagementPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "club/members",
        element: (
          <ScopeProtectedRoute resource="club-members">
            <ClubMemberPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "seasons",
        element: (
          <ScopeProtectedRoute resource="seasons">
            <SeasonManagementPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "schedule",
        element: (
          <ScopeProtectedRoute resource="schedule">
            <ScheduleManagementPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "training-sessions",
        element: <Navigate to="/app/schedule" replace />,
      },
      {
        path: "billing",
        element: (
          <ScopeProtectedRoute resource="billing">
            <BillingManagementPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "billing/:invoiceId",
        element: (
          <ScopeProtectedRoute resource="billing">
            <InvoiceDetailPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "billing/settings",
        element: (
          <ScopeProtectedRoute resource="billing-settings">
            <BillingSettingsPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "parent/billing",
        element: (
          <ScopeProtectedRoute resource="parent-billing">
            <ParentBillingPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "parent/billing/:invoiceId",
        element: (
          <ScopeProtectedRoute resource="parent-billing">
            <ParentInvoiceDetailPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "parent/children",
        element: (
          <ScopeProtectedRoute resource="parent-children">
            <MyChildrenPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "parent/children/:childId",
        element: (
          <ScopeProtectedRoute resource="parent-children">
            <ChildDetailPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "parent/schedule",
        element: (
          <ScopeProtectedRoute resource="parent-schedule">
            <ParentSchedulePage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "teams",
        element: (
          <ScopeProtectedRoute resource="teams">
            <TeamManagementPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "teams/:teamId",
        element: (
          <ScopeProtectedRoute resource="teams">
            <TeamDetailsPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "teams/:teamId/edit",
        element: (
          <ScopeProtectedRoute resource="teams" action="edit">
            <TeamEditPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "club/member/manage",
        element: (
          <ScopeProtectedRoute resource="club-members">
            <ManageMemberPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "club/member/manage/:memberId",
        element: (
          <ScopeProtectedRoute resource="club-members">
            <ManageMemberPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ScopeProtectedRoute resource="profile">
            <ProfileSettingsPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "account",
        element: (
          <ScopeProtectedRoute resource="profile">
            <AccountSettingsPage />
          </ScopeProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
