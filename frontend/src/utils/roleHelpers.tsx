import { UserRole } from "../types/user";
import { Shield, Building2, Trophy, User, Baby } from "lucide-react";

export const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return <Shield className="w-4 h-4" />;
    case 'club_manager':
      return <Building2 className="w-4 h-4" />;
    case 'member':
      return <Trophy className="w-4 h-4" />;
    case 'parent':
      return <Baby className="w-4 h-4" />;
    default:
      return <User className="w-4 h-4" />;
  }
};

export const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'club_manager':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'member':
      return 'bg-green-50 text-green-600 border-green-200';
    case 'parent':
      return 'bg-purple-50 text-purple-600 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

export const getRoleDisplayName = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'club_manager':
      return 'Club Manager';
    case 'member':
      return 'Member';
    case 'parent':
      return 'Parent';
    default:
      return 'User';
  }
};