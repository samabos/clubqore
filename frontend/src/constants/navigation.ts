import {
  Home,
  Users,
  Building2,
  CreditCard,
  MessageSquare,
  Calendar,
  CheckCircle,
  Baby,
  User,
  UserCog,
  Settings,
  Shield,
  CalendarDays,
  Trophy,
  Dumbbell,
  Receipt,
  DollarSign,
  LayoutDashboard,
  BarChart3,
  FileText,
  Lock,
  Boxes,
  ShieldCheck,
} from "lucide-react";
import { MenuItem } from "../types/user";
import { UserRole } from "../types/auth";

export const menuItemsByRole: Record<UserRole, MenuItem[]> = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/admin-dashboard", resource: "admin-dashboard" },
    { id: "members", label: "Member Management", icon: Users, link: "/app/members", resource: "member-management" },
    {
      id: "clubs",
      label: "Club Management",
      icon: Building2,
      children: [
        { id: "club-details", label: "Club Details", icon: Settings, link: "/app/club/setup", resource: "club-setup" },
        { id: "club-personnel", label: "Personnel", icon: UserCog, link: "/app/club/personnel", resource: "club-personnel" },
        { id: "club-members", label: "Club Members", icon: Users, link: "/app/club/members", resource: "club-members" },
        { id: "club-teams", label: "Teams", icon: Shield, link: "/app/teams", resource: "teams" },
      ]
    },
    { id: "communication", label: "Communication", icon: MessageSquare, link: "/communication", resource: "communication" },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile" },
  ],
  club_manager: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/club-manager-dashboard", resource: "club-manager-dashboard" },
    {
      id: "club",
      label: "Club Management",
      icon: Building2,
      children: [
        { id: "club-details", label: "Club Details", icon: Settings, link: "/app/club/setup", resource: "club-setup" },
        { id: "club-personnel", label: "Personnel", icon: UserCog, link: "/app/club/personnel", resource: "club-personnel" },
        { id: "club-members", label: "Members", icon: Users, link: "/app/club/members", resource: "club-members" },
        { id: "club-teams", label: "Teams", icon: Shield, link: "/app/teams", resource: "teams" },
      ]
    },
    {
      id: "operations",
      label: "Club Operations",
      icon: CalendarDays,
      children: [
        { id: "seasons", label: "Seasons", icon: Calendar, link: "/app/seasons", resource: "seasons" },
        { id: "schedule", label: "Schedule", icon: CalendarDays, link: "/app/schedule", resource: "schedule" },
      ]
    },
    {
      id: "financials",
      label: "Financials",
      icon: DollarSign,
      children: [
        { id: "billing", label: "Billing & Invoices", icon: Receipt, link: "/app/billing", resource: "billing" },
        { id: "billing-settings", label: "Billing Settings", icon: Settings, link: "/app/billing/settings", resource: "billing-settings" },
      ]
    },
    { id: "communication", label: "Communication", icon: MessageSquare, link: "/communication", resource: "communication" },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile" },
  ],
  member: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/member-dashboard", resource: "member-dashboard" },
    { id: "calendar", label: "My Schedule", icon: Calendar, link: "/calendar", resource: "my-schedule" },
    { id: "attendance", label: "My Attendance", icon: CheckCircle, link: "/attendance", resource: "my-attendance" },
    { id: "communication", label: "Messages", icon: MessageSquare, link: "/communication", resource: "communication" },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile" },
  ],
  parent: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/parent-dashboard", resource: "parent-dashboard" },
    { id: "children", label: "My Children", icon: Users, link: "/app/parent/children", resource: "parent-children" },
    { id: "schedule", label: "Schedules", icon: Calendar, link: "/app/parent/schedule", resource: "parent-schedule" },
    { id: "communication", label: "Messages", icon: MessageSquare, link: "/communication", resource: "communication" },
    { id: "billing", label: "Bills & Invoices", icon: Receipt, link: "/app/parent/billing", resource: "parent-billing" },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile" },
  ],
  staff: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/staff-dashboard", resource: "staff-dashboard" },
    { id: "communication", label: "Messages", icon: MessageSquare, link: "/communication", resource: "communication" },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile" },
  ],
  team_manager: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/team-manager-dashboard", resource: "team-manager-dashboard" },
    { id: "teams", label: "Teams", icon: Shield, link: "/app/teams", resource: "teams" },
    { id: "schedule", label: "Schedule", icon: CalendarDays, link: "/app/schedule", resource: "schedule" },
    { id: "communication", label: "Messages", icon: MessageSquare, link: "/communication", resource: "communication" },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile" },
  ],
  super_admin: [
    {
      id: "platform-overview",
      label: "Platform Overview",
      icon: LayoutDashboard,
      link: "/app/super-admin-dashboard",
      resource: "super-admin-dashboard",
    },
    {
      id: "club-management",
      label: "Club Management",
      icon: Building2,
      children: [
        {
          id: "clubs",
          label: "All Clubs",
          icon: Building2,
          link: "/app/admin/clubs",
          resource: "admin-clubs",
        },
        {
          id: "club-approvals",
          label: "Club Approvals",
          icon: CheckCircle,
          link: "/app/admin/clubs/approvals",
          resource: "admin-club-approvals",
        },
      ],
    },
    {
      id: "billing-management",
      label: "Billing Management",
      icon: DollarSign,
      children: [
        {
          id: "club-billing-settings",
          label: "Club Billing Settings",
          icon: Settings,
          link: "/app/admin/billing/settings",
          resource: "admin-billing-settings",
        },
        {
          id: "scheduled-jobs",
          label: "Scheduled Invoice Jobs",
          icon: Calendar,
          link: "/app/admin/billing/jobs",
          resource: "admin-billing-jobs",
        },
      ],
    },
    {
      id: "platform-analytics",
      label: "Analytics",
      icon: BarChart3,
      link: "/app/admin/analytics",
      resource: "admin-analytics",
    },
    {
      id: "audit-logs",
      label: "Audit Logs",
      icon: FileText,
      link: "/app/admin/audit-logs",
      resource: "admin-audit-logs",
    },
    {
      id: "platform-settings",
      label: "Platform Settings",
      icon: Settings,
      link: "/app/admin/settings",
      resource: "admin-settings",
    },
    {
      id: "permissions",
      label: "Permissions",
      icon: Lock,
      children: [
        {
          id: "resources",
          label: "Resources",
          icon: Boxes,
          link: "/app/admin/resources",
          resource: "admin-resources",
        },
        {
          id: "role-permissions",
          label: "Role Permissions",
          icon: ShieldCheck,
          link: "/app/admin/permissions",
          resource: "admin-permissions",
        },
      ],
    },
    { id: "communication", label: "Messages", icon: MessageSquare, link: "/communication", resource: "communication" },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile" },
  ],
};
