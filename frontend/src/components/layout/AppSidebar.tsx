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

interface AppSidebarProps {
  currentUser: AuthUser;
  menuItems: MenuItem[];
}

export function AppSidebar({ currentUser, menuItems }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

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
            <p className="text-sidebar-foreground text-sm truncate">
              {currentUser.primaryRole}
            </p>
          </div>
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.link;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => navigate(item.link)}
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
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
