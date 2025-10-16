import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { SidebarProvider } from "../ui/sidebar";
import { useNavigationSetup } from "../../hooks/useNavigationSetup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { menuItemsByRole } from "../../constants/navigation";
import {
  getRoleIcon,
  getRoleColor,
  getRoleDisplayName,
} from "../../utils/roleHelpers";
import { useAuth, useResponsive } from "../../hooks";
import { useAppStore } from "../../store";
import { useLocation } from "react-router-dom";
import type { MenuItem } from "../../types/user";
import type { UserRoleInfo, UserRole } from "../../types/auth";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";

export function AppLayout() {
  // Initialize navigation in the store
  useNavigationSetup();

  const { user, currentRole } = useAuth();
  const { isMobile } = useResponsive();
  const location = useLocation();

  const { handleRoleChange, handleLogout } = useAppStore();

  // Get current active menu item based on pathname
  const getCurrentMenuItem = (menuItems: MenuItem[]) => {
    return (
      menuItems.find((item) => item.link === location.pathname) || menuItems[0]
    );
  };

  const menuItems = user
    ? menuItemsByRole[currentRole as UserRole]
    : menuItemsByRole[currentRole as UserRole];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        {/* Desktop Sidebar */}
        {user && <AppSidebar currentUser={user} menuItems={menuItems} />}

        <main className="flex-1 flex flex-col">
          {/* Mobile Navigation */}
          {isMobile && user && (
            <MobileNavigation currentUser={user} menuItems={menuItems} />
          )}

          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm hidden lg:block">
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
              <div className="flex items-center gap-2 lg:gap-4">
                <div className="hidden lg:block">
                  {/* SidebarTrigger would go here */}
                </div>

                <div className="hidden lg:block border-l border-gray-200 pl-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {getCurrentMenuItem(menuItems)?.label || "Dashboard"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Welcome back! Here's what's happening today.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-4">
                {/* Role Switcher - Show only if user has multiple roles */}
                {user && user.roles && user.roles.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden lg:inline">
                      Switch Role:
                    </span>
                    <Select
                      value={currentRole}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger className="w-[140px] lg:w-[160px] rounded-xl border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {user.roles.map((roleInfo: UserRoleInfo) => (
                          <SelectItem key={roleInfo.role} value={roleInfo.role}>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(roleInfo.role)}
                              <span className="hidden lg:inline">
                                {getRoleDisplayName(roleInfo.role)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Demo Role Switcher - Show only when no real user is logged in */}
                {!user && (
                  <div className="hidden lg:flex items-center gap-2">
                    <span className="text-sm text-gray-600">Demo Role:</span>
                    <Select
                      value={currentRole}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger className="w-[160px] rounded-xl border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            {getRoleIcon("admin")}
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="club_manager">
                          <div className="flex items-center gap-2">
                            {getRoleIcon("club_manager")}
                            Club Manager
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            {getRoleIcon("member")}
                            Member
                          </div>
                        </SelectItem>
                        <SelectItem value="parent">
                          <div className="flex items-center gap-2">
                            {getRoleIcon("parent")}
                            Parent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Current Role Badge */}
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-1 rounded-lg ${getRoleColor(
                    currentRole
                  )} hidden lg:flex items-center gap-1`}
                >
                  {getRoleIcon(currentRole)}
                  <span className="capitalize">
                    {getRoleDisplayName(currentRole)}
                  </span>
                </Badge>

                {/* User Avatar and Info with Dropdown - Desktop only */}
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl"
                      >
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-primary flex items-center justify-center">
                          <span className="text-white text-sm lg:text-base font-medium">
                            {user?.initials}
                          </span>
                        </div>
                        <div className="hidden xl:block text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500 hidden lg:block" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-6 bg-gray-50 pb-20 lg:pb-6">
            <div className="max-w-7xl mx-auto">
              {/* Mobile Page Title */}
              {isMobile && (
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        {getCurrentMenuItem(menuItems)?.label || "Dashboard"}
                      </h1>
                      <p className="text-sm text-gray-500">
                        Welcome back! Here's what's happening today.
                      </p>
                    </div>
                    {user && user.roles && user.roles.length > 1 && (
                      <Select
                        value={currentRole}
                        onValueChange={handleRoleChange}
                      >
                        <SelectTrigger className="w-[120px] rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {user.roles.map((roleInfo: UserRoleInfo) => (
                            <SelectItem
                              key={roleInfo.role}
                              value={roleInfo.role}
                            >
                              <div className="flex items-center gap-2">
                                {getRoleIcon(roleInfo.role)}
                                <span className="text-xs">
                                  {getRoleDisplayName(roleInfo.role)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}

              {/* Route Content */}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
