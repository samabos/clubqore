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
  Layers,
  Repeat,
  Wallet,
  Sliders,
  Briefcase,
  TrendingUp,
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
        { id: "membership-tiers", label: "Membership Tiers", icon: Layers, link: "/app/membership-tiers", resource: "membership-tiers" },
        { id: "subscriptions", label: "Subscriptions", icon: Repeat, link: "/app/subscriptions", resource: "subscriptions" },
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
    {
      id: "billing",
      label: "Billing",
      icon: DollarSign,
      children: [
        { id: "subscriptions", label: "Subscriptions", icon: Repeat, link: "/app/parent/subscriptions", resource: "parent-subscriptions" },
        { id: "payment-methods", label: "Payment Methods", icon: Wallet, link: "/app/parent/payment-methods", resource: "parent-payment-methods" },
        { id: "invoices", label: "Bills & Invoices", icon: Receipt, link: "/app/parent/billing", resource: "parent-billing" },
      ]
    },
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
      id: "settings",
      label: "Settings",
      icon: Settings,
      resource: "super-admin-settings",
      children: [
        {
          id: "platform-settings",
          label: "Platform Settings",
          icon: Sliders,
          link: "/app/admin/settings",
          resource: "admin-settings",
        },
        {
          id: "resources",
          label: "Resources",
          icon: Boxes,
          link: "/app/admin/resources",
          resource: "admin-resources",
        },
        {
          id: "role-permissions",
          label: "Permissions",
          icon: ShieldCheck,
          link: "/app/admin/permissions",
          resource: "admin-permissions",
        },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      resource: "super-admin-reports",
      children: [
        {
          id: "analytics",
          label: "Analytics",
          icon: TrendingUp,
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
      ],
    },
    {
      id: "operations",
      label: "Operations",
      icon: Briefcase,
      resource: "super-admin-operations",
      children: [
        {
          id: "club-management",
          label: "Club Management",
          icon: Building2,
          resource: "super-admin-club-management",
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
          icon: Receipt,
          resource: "super-admin-billing-management",
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
      ],
    },
    { id: "communication", label: "Messages", icon: MessageSquare, link: "/communication", resource: "communication" },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile" },
  ],
};
