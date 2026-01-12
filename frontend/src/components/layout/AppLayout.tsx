import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { SidebarProvider } from "../ui/sidebar";
import { useNavigationSetup } from "../../hooks/useNavigationSetup";
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
import { useAppStore } from "../../stores/appStore";
import { useAuth } from "../../stores/authStore";
import { useLocation } from "react-router-dom";
import type { MenuItem, UserRole } from "../../types/user";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";

export function AppLayout() {
  // Initialize navigation in the store
  useNavigationSetup();

  const { isMobile } = useAppStore();
  const { user, signOut, currentRole } = useAuth(); // Get user and currentRole from auth store
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get current active menu item based on pathname (including submenus)
  const getCurrentMenuItem = (menuItems?: MenuItem[]): MenuItem | null => {
    if (!menuItems || menuItems.length === 0) {
      return null;
    }

    for (const item of menuItems) {
      // Check if this item matches the current path
      if (item.link === location.pathname) {
        return item;
      }

      // Check if any child item matches the current path
      if (item.children) {
        const matchingChild = item.children.find(
          (child) => child.link === location.pathname
        );
        if (matchingChild) {
          return item; // Return the parent item for submenus
        }
      }
    }

    // Return the first item as fallback
    return menuItems[0] || null;
  };

  // Get menu items for current role with fallback to club_manager if role is invalid
  const menuItems = currentRole && menuItemsByRole[currentRole as UserRole]
    ? menuItemsByRole[currentRole as UserRole]
    : menuItemsByRole.club_manager || [];

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

                <div className="hidden lg:block">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {getCurrentMenuItem(menuItems)?.label || "Dashboard"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Welcome back! Here's what's happening today.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-4">
                {/* Current Role Badge */}
                {currentRole && (
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
                )}

                {/* User Avatar and Info with Dropdown - Desktop only */}
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl"
                      >
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user?.name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm lg:text-base font-medium">
                              {user?.initials}
                            </span>
                          )}
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
                      <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/app/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/app/account')}>
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
            <div className="items-center justify-center gap-2 lg:gap-4 mx-4">
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
