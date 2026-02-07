import {
  Home,
  Users,
  Building2,
  Calendar,
  User,
  UserCog,
  Settings,
  Shield,
  CalendarDays,
  Receipt,
  DollarSign,
  LayoutDashboard,
  Boxes,
  ShieldCheck,
  Layers,
  Repeat,
  Wallet,
  Sliders,
  Briefcase,
  PlayCircle,
} from "lucide-react";
import { MenuItem } from "../types/user";
import { UserRole } from "../types/auth";

export const menuItemsByRole: Record<UserRole, MenuItem[]> = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/admin-dashboard", resource: "admin-dashboard", sortOrder: 1 },
    {
      id: "clubs",
      label: "Club Management",
      icon: Building2,
      sortOrder: 3,
      children: [
        { id: "club-details", label: "Club Details", icon: Settings, link: "/app/club/setup", resource: "club-setup", sortOrder: 1 },
        { id: "club-personnel", label: "Personnel", icon: UserCog, link: "/app/club/personnel", resource: "club-personnel", sortOrder: 2 },
        { id: "club-members", label: "Club Members", icon: Users, link: "/app/club/members", resource: "club-members", sortOrder: 3 },
        { id: "club-teams", label: "Teams", icon: Shield, link: "/app/teams", resource: "teams", sortOrder: 4 },
      ]
    },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile", sortOrder: 99 },
  ],
  club_manager: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/club-manager-dashboard", resource: "club-manager-dashboard", sortOrder: 1 },
    {
      id: "club",
      label: "Club Management",
      icon: Building2,
      sortOrder: 2,
      children: [
        { id: "club-details", label: "Club Details", icon: Settings, link: "/app/club/setup", resource: "club-setup", sortOrder: 1 },
        { id: "club-personnel", label: "Personnel", icon: UserCog, link: "/app/club/personnel", resource: "club-personnel", sortOrder: 2 },
        { id: "club-members", label: "Members", icon: Users, link: "/app/club/members", resource: "club-members", sortOrder: 3 },
        { id: "club-teams", label: "Teams", icon: Shield, link: "/app/teams", resource: "teams", sortOrder: 4 },
      ]
    },
    {
      id: "operations",
      label: "Club Operations",
      icon: CalendarDays,
      sortOrder: 3,
      children: [
        { id: "seasons", label: "Seasons", icon: Calendar, link: "/app/seasons", resource: "seasons", sortOrder: 1 },
        { id: "schedule", label: "Schedule", icon: CalendarDays, link: "/app/schedule", resource: "schedule", sortOrder: 2 },
      ]
    },
    {
      id: "financials",
      label: "Financials",
      icon: DollarSign,
      sortOrder: 4,
      children: [
        { id: "membership-tiers", label: "Membership Tiers", icon: Layers, link: "/app/membership-tiers", resource: "membership-tiers", sortOrder: 1 },
        { id: "subscriptions", label: "Subscriptions", icon: Repeat, link: "/app/subscriptions", resource: "subscriptions", sortOrder: 2 },
        { id: "billing", label: "Billing & Invoices", icon: Receipt, link: "/app/billing", resource: "billing", sortOrder: 3 },
        { id: "billing-settings", label: "Billing Settings", icon: Settings, link: "/app/billing/settings", resource: "billing-settings", sortOrder: 4 },
      ]
    },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile", sortOrder: 99 },
  ],
  member: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/member-dashboard", resource: "member-dashboard", sortOrder: 1 },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile", sortOrder: 99 },
  ],
  parent: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/parent-dashboard", resource: "parent-dashboard", sortOrder: 1 },
    { id: "children", label: "My Children", icon: Users, link: "/app/parent/children", resource: "parent-children", sortOrder: 2 },
    { id: "schedule", label: "Schedules", icon: Calendar, link: "/app/parent/schedule", resource: "parent-schedule", sortOrder: 3 },
    {
      id: "billing",
      label: "Billing",
      icon: DollarSign,
      sortOrder: 4,
      children: [
        { id: "subscriptions", label: "Subscriptions", icon: Repeat, link: "/app/parent/subscriptions", resource: "parent-subscriptions", sortOrder: 1 },
        { id: "payment-methods", label: "Payment Methods", icon: Wallet, link: "/app/parent/payment-methods", resource: "parent-payment-methods", sortOrder: 2 },
        { id: "invoices", label: "Bills & Invoices", icon: Receipt, link: "/app/parent/billing", resource: "parent-billing", sortOrder: 3 },
      ]
    },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile", sortOrder: 99 },
  ],
  staff: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/staff-dashboard", resource: "staff-dashboard", sortOrder: 1 },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile", sortOrder: 99 },
  ],
  team_manager: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/team-manager-dashboard", resource: "team-manager-dashboard", sortOrder: 1 },
    { id: "teams", label: "Teams", icon: Shield, link: "/app/teams", resource: "teams", sortOrder: 2 },
    { id: "schedule", label: "Schedule", icon: CalendarDays, link: "/app/schedule", resource: "schedule", sortOrder: 3 },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile", sortOrder: 99 },
  ],
  super_admin: [
    {
      id: "platform-overview",
      label: "Platform Overview",
      icon: LayoutDashboard,
      link: "/app/super-admin-dashboard",
      resource: "super-admin-dashboard",
      sortOrder: 1,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      resource: "super-admin-settings",
      sortOrder: 2,
      children: [
        {
          id: "platform-settings",
          label: "Platform Settings",
          icon: Sliders,
          link: "/app/admin/settings",
          resource: "admin-settings",
          sortOrder: 1,
        },
        {
          id: "resources",
          label: "Resources",
          icon: Boxes,
          link: "/app/admin/resources",
          resource: "admin-resources",
          sortOrder: 2,
        },
        {
          id: "role-permissions",
          label: "Permissions",
          icon: ShieldCheck,
          link: "/app/admin/permissions",
          resource: "admin-permissions",
          sortOrder: 3,
        },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      icon: Briefcase,
      resource: "super-admin-operations",
      sortOrder: 3,
      children: [
        {
          id: "billing-management",
          label: "Billing Management",
          icon: Receipt,
          resource: "super-admin-billing-management",
          sortOrder: 1,
        },
            {
              id: "club-billing-settings",
              label: "Club Billing Settings",
              icon: Settings,
              link: "/app/admin/billing/settings",
              resource: "admin-billing-settings",
              sortOrder: 1,
            },
            {
              id: "billing-jobs",
              label: "Billing Jobs",
              icon: PlayCircle,
              link: "/app/admin/billing/jobs",
              resource: "admin-billing-jobs",
              sortOrder: 2,
            },
          ] 
    },
    { id: "profile", label: "Profile", icon: User, link: "/app/profile", resource: "profile", sortOrder: 99 },
  ],
};
