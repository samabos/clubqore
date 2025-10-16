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
} from "lucide-react";
import { MenuItem } from "../types/user";
import { UserRole } from "../types/auth";

export const menuItemsByRole: Record<UserRole, MenuItem[]> = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/admin-dashboard" },
    { id: "members", label: "Member Management", icon: Users, link: "/app/members" },
    { id: "clubs", label: "Club Management", icon: Building2, link: "/clubs" },
    { id: "billing", label: "Billing & Payments", icon: CreditCard, link: "/billing" },
    { id: "communication", label: "Communication", icon: MessageSquare, link: "/communication" },
    { id: "calendar", label: "Calendar", icon: Calendar, link: "/calendar" },
    { id: "attendance", label: "Attendance", icon: CheckCircle, link: "/attendance" },
    { id: "parent", label: "Parent Module", icon: Baby, link: "/parent" },
    { id: "profile", label: "Profile", icon: User, link: "/profile" },
  ],
  club_manager: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/club-manager-dashboard" },
    { id: "club", label: "Club Management", icon: Building2, link: "club/setup" },
    { id: "club-members", label: "Club Members", icon: Users, link: "club/members" },
    { id: "member-management", label: "Member Management", icon: Users, link: "/app/members" },
    { id: "billing", label: "Club Billing", icon: CreditCard, link: "/billing" },
    { id: "communication", label: "Communication", icon: MessageSquare, link: "/communication" },
    { id: "calendar", label: "Calendar", icon: Calendar, link: "/calendar" },
    { id: "attendance", label: "Attendance", icon: CheckCircle, link: "/attendance" },
    { id: "profile", label: "Profile", icon: User, link: "/profile" },
  ],
  member: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/member-dashboard" },
    { id: "calendar", label: "My Schedule", icon: Calendar, link: "/calendar" },
    { id: "attendance", label: "My Attendance", icon: CheckCircle, link: "/attendance" },
    { id: "communication", label: "Messages", icon: MessageSquare, link: "/communication" },
    { id: "profile", label: "Profile", icon: User, link: "/profile" },
  ],
  parent: [
    { id: "dashboard", label: "Dashboard", icon: Home, link: "/app/parent-dashboard" },
    { id: "children", label: "My Children", icon: Baby, link: "/children" },
    { id: "calendar", label: "Activities", icon: Calendar, link: "/calendar" },
    { id: "communication", label: "Messages", icon: MessageSquare, link: "/communication" },
    { id: "billing", label: "Payments", icon: CreditCard, link: "/billing" },
    { id: "profile", label: "Profile", icon: User, link: "/profile" },
  ]
};
