import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { SidebarTrigger } from "../ui/sidebar";
import { MenuItem } from "@/types/user";
import { AuthUser, UserRole } from "@/types/auth";
import { getRoleIcon, getRoleColor } from "@/utils/roleHelpers";
import { Search, Bell, Settings, ChevronDown, ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  currentUser: AuthUser;
  userRole: UserRole;
  activeView: string;
  menuItems: MenuItem[];
  onBackToLanding: () => void;
}

export function AppHeader({
  currentUser,
  userRole,
  activeView,
  menuItems,
  onBackToLanding,
}: AppHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm hidden lg:block">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 hidden lg:block">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden lg:block">
            <SidebarTrigger />
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLanding}
              className="text-gray-500 hover:text-gray-700 rounded-xl text-sm lg:text-base"
            >
              <ArrowLeft className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Back to Landing</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <div className="hidden lg:block pl-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find((item) => item.id === activeView)?.label ||
                  "Dashboard"}
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back! Here's what's happening today.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Current Role Badge */}
          <Badge
            variant="outline"
            className={`text-xs px-2 py-1 rounded-lg ${getRoleColor(
              userRole
            )} hidden lg:flex items-center gap-1`}
          >
            {getRoleIcon(userRole)}
            {userRole === "club_manager" && "Club Manager"}
            {userRole === "admin" && "Admin"}
            {userRole === "member" && "Member"}
            {userRole === "parent" && "Parent"}
          </Badge>

          {/* Search - Responsive */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-48 lg:w-64 text-sm"
            />
          </div>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 rounded-xl"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2 rounded-xl">
            <Bell className="w-5 h-5 text-gray-600" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center p-0 text-xs bg-red-500 rounded-full">
              3
            </Badge>
          </Button>

          {/* Settings - Hidden on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:block p-2 rounded-xl"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </Button>

          {/* User Menu - Desktop only */}
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-200">
            <Avatar className="w-10 h-10 rounded-xl">
              <AvatarImage src={currentUser.profile?.profileImage} />
              <AvatarFallback className="bg-primary text-white text-sm rounded-xl">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:block">
              <p className="text-sm font-medium text-gray-900">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0 rounded-lg ${getRoleColor(
                    userRole
                  )}`}
                >
                  {getRoleIcon(userRole)}
                  <span className="ml-1 capitalize">
                    {userRole.replace("_", " ")}
                  </span>
                </Badge>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
