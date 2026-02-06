import { Button } from "../ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "../ui/sidebar";
import { MenuItem } from "../../types/user";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthUser } from "../../types/auth";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getRoleDisplayName } from "../../utils/roleHelpers";
import { useAuth } from "../../stores/authStore";
import { canView } from "../../api/secureAuth";

interface AppSidebarProps {
  currentUser: AuthUser;
  menuItems: MenuItem[];
}

export function AppSidebar({ menuItems }: AppSidebarProps) {
  const { currentRole, scopes } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Filter and sort menu items based on user scopes and sortOrder
  const filteredMenuItems = useMemo(() => {
    const filterItem = (item: MenuItem): MenuItem | null => {
      // If item has a resource, check if user has view permission
      if (item.resource && !canView(scopes, item.resource)) {
        return null;
      }

      // If item has children, filter and sort them recursively
      if (item.children) {
        const filteredChildren = item.children
          .map(filterItem)
          .filter((child): child is MenuItem => child !== null)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        // If no children remain after filtering, hide the parent menu
        if (filteredChildren.length === 0) {
          return null;
        }

        return { ...item, children: filteredChildren };
      }

      return item;
    };

    return menuItems
      .map(filterItem)
      .filter((item): item is MenuItem => item !== null)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [menuItems, scopes]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.has(menuId);

  const isMenuItemActive = (item: MenuItem): boolean => {
    if (item.link && location.pathname === item.link) {
      return true;
    }
    if (item.children) {
      return item.children.some((child) => isMenuItemActive(child));
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = isMenuItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item.id);

    if (hasChildren) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            onClick={() => toggleMenu(item.id)}
            isActive={isActive}
            className={`w-full justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-primary text-white shadow-md"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </SidebarMenuButton>
          {isExpanded && item.children && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => {
                const isChildActive = location.pathname === child.link;
                return (
                  <SidebarMenuItem key={child.id}>
                    <SidebarMenuButton
                      onClick={() => navigate(child.link!)}
                      isActive={isChildActive}
                      className={`w-full justify-start px-4 py-2 rounded-lg transition-all duration-200 ${
                        isChildActive
                          ? "bg-primary/20 text-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                      }`}
                    >
                      <child.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium truncate text-sm">
                        {child.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </div>
          )}
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => navigate(item.link!)}
          isActive={isActive}
          className={`w-full justify-start px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-primary text-white shadow-md"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
          }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium truncate">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="hidden lg:flex border-r-0 shadow-lg">
      <SidebarHeader className="p-6 border-b border-gray-700/50">
        <Button
          variant="ghost"
          className="flex items-center gap-3 p-0 h-auto hover:bg-transparent cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">CQ</span>
          </div>
          <div className="text-left">
            <h2 className="text-white font-semibold text-lg">ClubQore</h2>
            {currentRole && (
              <p className="text-sidebar-foreground text-sm truncate">
                {getRoleDisplayName(currentRole)}
              </p>
            )}
          </div>
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {filteredMenuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
