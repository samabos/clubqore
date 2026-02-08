import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import { LandingPage } from "../modules/home";
import { Authentication, ResetPasswordPage } from "../modules/authentication";
import { ParentRegistrationPage } from "../modules/authentication/pages/parent-registration.page";
import { OnboardingWrapper } from "../components/onboarding/OnboardingWrapper";
import { EmailVerificationCallback } from "../components/EmailVerificationCallback";
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
} from "../modules/team";
import { PersonnelManagementPage } from "../modules/personnel/pages";
import { ClubMemberPage, ManageMemberPage } from "../modules/member/pages";
import { SeasonManagementPage } from "../modules/season/pages/season-management.page";
import { ScheduleManagementPage } from "../modules/schedule/pages/schedule-management.page";
import {
  BillingManagementPage,
  InvoiceDetailPage,
  ParentBillingPage,
  ParentInvoiceDetailPage,
  AdminBillingSettingsPage,
} from "../modules/billing/pages";
import {
  MembershipTierManagementPage,
  SubscriptionManagementPage,
} from "../modules/subscription/pages";
import {
  PaymentMethodsPage,
  ParentSubscriptionManagementPage,
  MandateCallbackPage,
} from "../modules/parent-billing/pages";
import {
  ResourceManagementPage,
  PermissionManagementPage,
  SystemSettingsPage,
  BillingJobsPage,
  AdminSubscriptionsPage,
  AdminInvoicesPage,
} from "../modules/admin";
import { MyChildrenPage, ParentSchedulePage } from "../modules/parent/pages";
import { ProfileSettingsPage } from "../modules/profile";
import { AccountSettingsPage } from "../modules/account";
import { ParentModule } from "../components/ParentModule";
import { AppLayout } from "../components/layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
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
    path: "/register/parent/:inviteCode",
    element: <ParentRegistrationPage />,
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
                <BillingJobsPage />
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "subscriptions",
            element: (
              <ScopeProtectedRoute resource="admin-subscriptions">
                <AdminSubscriptionsPage />
              </ScopeProtectedRoute>
            ),
          },
          {
            path: "invoices",
            element: (
              <ScopeProtectedRoute resource="admin-invoices">
                <AdminInvoicesPage />
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
                <SystemSettingsPage />
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
        element: <Navigate to="/app/club/members" replace />,
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
        path: "membership-tiers",
        element: (
          <ScopeProtectedRoute resource="membership-tiers">
            <MembershipTierManagementPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "subscriptions",
        element: (
          <ScopeProtectedRoute resource="subscriptions">
            <SubscriptionManagementPage />
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
        path: "parent/subscriptions",
        element: (
          <ScopeProtectedRoute resource="parent-subscriptions">
            <ParentSubscriptionManagementPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "parent/payment-methods",
        element: (
          <ScopeProtectedRoute resource="parent-payment-methods">
            <PaymentMethodsPage />
          </ScopeProtectedRoute>
        ),
      },
      {
        path: "parent/payment-methods/callback",
        element: <MandateCallbackPage />,
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
        // Redirect old child detail URLs to the combined page
        path: "parent/children/:childId",
        loader: ({ params }) => redirect(`/app/parent/children?childId=${params.childId}`),
        element: null,
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
