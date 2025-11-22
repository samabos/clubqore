import { createBrowserRouter, Navigate } from "react-router-dom";
import { LandingPage } from "../components/home";
import { Authentication } from "../modules/authentication";
import { OnboardingWrapper } from "../components/onboarding/OnboardingWrapper";
import { EmailVerificationCallback } from "../components/EmailVerificationCallback";
import { RoleBasedRedirect } from "../components/RoleBasedRedirect";
import { Dashboard } from "../components/Dashboard";
import { AdminDashboard } from "../components/AdminDashboard";
import { MemberDashboard } from "../components/MemberDashboard";
import { ParentDashboard } from "../components/ParentDashboard";
import { ClubManagerDashboard, ClubSetupPage } from "../modules/club/pages";
import {
  TeamManagementPage,
  TeamDetailsPage,
  TeamEditPage,
} from "../modules/team";
import { PersonnelManagementPage } from "../modules/personnel/pages";
import { ClubMemberPage, ManageMemberPage } from "../modules/member/pages";
import { ParentModule } from "../components/ParentModule";
import { AppLayout } from "../components/layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { MembersLayout } from "../components/members";

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
        element: <AdminDashboard />,
      },
      {
        path: "member-dashboard",
        element: <MemberDashboard />,
      },
      {
        path: "parent-dashboard",
        element: <ParentDashboard />,
      },
      {
        path: "club-manager-dashboard",
        element: <ClubManagerDashboard />,
      },
      {
        path: "staff-dashboard",
        element: <LandingPage />,
      },
      {
        path: "team-manager-dashboard",
        element: <LandingPage />,
      },
      {
        path: "parent",
        element: <ParentModule />,
      },
      {
        path: "members",
        element: <MembersLayout />,
      },
      {
        path: "club/setup",
        element: <ClubSetupPage />,
      },
      {
        path: "club/personnel",
        element: <PersonnelManagementPage />,
      },
      {
        path: "club/members",
        element: <ClubMemberPage />,
      },
      {
        path: "teams",
        element: <TeamManagementPage />,
      },
      {
        path: "teams/:teamId",
        element: <TeamDetailsPage />,
      },
      {
        path: "teams/:teamId/edit",
        element: <TeamEditPage />,
      },
      {
        path: "club/member/manage",
        element: <ManageMemberPage />,
      },
      {
        path: "club/member/manage/:memberId",
        element: <ManageMemberPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
