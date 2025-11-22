import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../stores/authStore";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import { getDefaultRouteByRole } from "../../utils/roleNavigation";
import { AuthUser } from "@/types/auth";

interface LandingNavigationProps {
  onGetStarted?: () => void;
}

export function LandingNavigation({ onGetStarted }: LandingNavigationProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Helper functions for user display
  const getDisplayName = (user: AuthUser) => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user?.profile?.firstName) {
      return user.profile.firstName;
    }
    return user?.email?.split("@")[0] || "User";
  };

  const generateInitials = (name?: string, email?: string) => {
    if (name) {
      const nameParts = name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      const emailParts = email.split("@")[0];
      return emailParts.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Get the appropriate dashboard route for the user
  const getDashboardRoute = () => {
    if (user) {
      return getDefaultRouteByRole(user.roles);
    }
    return "/app"; // Fallback to role-based redirect
  };

  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      // If logged in, check if onboarding is complete
      if (user.isOnboarded) {
        navigate(getDashboardRoute());
      } else {
        navigate("/onboarding");
      }
    } else {
      // If not logged in, go to auth
      if (onGetStarted) {
        onGetStarted();
      } else {
        navigate("/auth");
      }
    }
  };

  return (
    <nav className="bg-white/75 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">CQ</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ClubQore</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#about"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact
            </a>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              /* Logged in user section */
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(getDashboardRoute())}
                  className="rounded-xl"
                >
                  Go to Dashboard
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-8 px-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.profile?.profileImage} />
                        <AvatarFallback className="text-xs">
                          {generateInitials(getDisplayName(user), user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 hidden sm:block">
                        {getDisplayName(user)}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => navigate(getDashboardRoute())}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              /* Not logged in section */
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => navigate("/auth")}
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleGetStarted}
                  className="rounded-xl gradient-primary text-white hover:opacity-90"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile version */}
            <div className="md:hidden">
              {isAuthenticated && user ? (
                /* Logged in user section - Mobile */
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(getDashboardRoute())}
                    className="rounded-xl text-sm"
                    size="sm"
                  >
                    Dashboard
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 h-8 px-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.profile?.profileImage} />
                          <AvatarFallback className="text-xs">
                            {generateInitials(getDisplayName(user), user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                /* Not logged in section - Mobile */
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-xl text-sm"
                    onClick={() => navigate("/auth")}
                    size="sm"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleGetStarted}
                    className="rounded-xl gradient-primary text-white hover:opacity-90 text-sm"
                    size="sm"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
