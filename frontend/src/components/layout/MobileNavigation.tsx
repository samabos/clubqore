import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { MenuItem } from "../../types/user";
import { AuthUser } from "../../types/auth";
import { useAppStore } from "../../store";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, User, Settings, LogOut, ChevronDown } from "lucide-react";

interface MobileNavigationProps {
  currentUser: AuthUser;
  menuItems: MenuItem[];
}

export function MobileNavigation({
  currentUser,
  menuItems,
}: MobileNavigationProps) {
  const { handleLogout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            className="flex items-center gap-3 p-0 h-auto hover:bg-transparent cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CQ</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">ClubQore</h1>
            </div>
          </Button>

          <div className="flex items-center gap-3">
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <Avatar className="w-8 h-8 rounded-lg">
                    <AvatarImage src={currentUser.profile?.profileImage} />
                    <AvatarFallback className="bg-primary text-white text-xs rounded-lg">
                      {currentUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
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

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetHeader className="p-6 border-b border-gray-100">
                  <SheetTitle className="text-gray-900 text-left">
                    Navigation Menu
                  </SheetTitle>
                </SheetHeader>

                <div className="p-4">
                  <nav className="space-y-2">
                    {menuItems.map((item) => {
                      const isActive = location.pathname === item.link;
                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? "default" : "ghost"}
                          onClick={() => navigate(item.link)}
                          className={`w-full justify-start px-4 py-3 rounded-xl ${
                            isActive
                              ? "gradient-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {menuItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.link;
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => navigate(item.link)}
                className={`flex flex-col items-center gap-1 h-auto py-3 px-2 rounded-xl ${
                  isActive ? "text-primary bg-primary/10" : "text-gray-600"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium truncate">
                  {item.label.split(" ")[0]}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}
