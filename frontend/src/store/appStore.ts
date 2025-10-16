import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser, UserRole } from '../types/auth';
import { authAPI } from '../api/auth';
import { Club } from '@/types/club';

export type AppState = 'landing' | 'auth' | 'onboarding' | 'dashboard';

export interface AppStore {
  // State
  appState: AppState;
  user: AuthUser | null;
  userClub: Club | null;
  clubDataLoaded: boolean; // Track if club data has been checked
  isAuthenticated: boolean;
  currentRole: UserRole;
  activeView: string;
  isMobile: boolean;
  sidebarOpen: boolean;

  // Actions
  setAppState: (state: AppState) => void;
  setUser: (user: AuthUser | null) => void;
  setUserClub: (club: Club | null) => void;
  setClubDataLoaded: (loaded: boolean) => void;
  setCurrentRole: (role: UserRole) => void;
  setActiveView: (view: string) => void;
  setIsMobile: (isMobile: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setNavigate: (navigate: (path: string) => void) => void;

  // Handlers
  handleGetStarted: () => void;
  handleBackToLanding: () => void;
  handleRoleChange: (role: UserRole) => void;
  handleLogin: (user: AuthUser) => void;
  handleLogout: () => void;
  handleOnboardingComplete: () => void;
  
  // Navigation helpers (will be set by router)
  navigate?: (path: string) => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        appState: "landing",
        user: null,
        userClub: null,
        clubDataLoaded: false,
        isAuthenticated: false,
        currentRole: "admin",
        activeView: "dashboard",
        isMobile: false,
        sidebarOpen: false,

        // Actions
        setAppState: (state) => set({ appState: state }),
        setUser: (user) => {
          // When setting user to null, also clear tokens
          if (!user) {
            import('../api/auth').then(({ tokenManager }) => {
              tokenManager.clearTokens();
            });
          }
          set({ user, isAuthenticated: !!user });
        },
        setUserClub: (club) => set({ userClub: club }),
        setClubDataLoaded: (loaded) => set({ clubDataLoaded: loaded }),
        setCurrentRole: (role) => set({ currentRole: role }),
        setActiveView: (view) => set({ activeView: view }),
        setIsMobile: (isMobile) => set({ isMobile }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setNavigate: (navigate) => set({ navigate }),

        // Handlers
        handleGetStarted: () => {
          const { navigate } = get();
          if (navigate) navigate('/auth');
        },
        handleBackToLanding: () => {
          const { navigate } = get();
          set({ appState: "landing", activeView: "dashboard" });
          if (navigate) navigate('/');
        },
        handleRoleChange: (role) => {
          const { user } = get();
          if (user && user.roles && user.roles.some((r) => r.role === role)) {
            set({ currentRole: role });
          } else {
            // For demo purposes when no user is logged in
            set({ currentRole: role });
          }
        },
        handleLogin: (userData) => {
          const { navigate } = get();
          // Helper to get display name
          const getDisplayName = (user: AuthUser) => {
            if (!user) return "User";
            const fullName =
              user.profile?.fullName ||
              `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim();
            if (fullName && fullName.trim()) return fullName;
            if (user.email && user.email.trim()) return user.email.split("@")[0];
            return "User";
          };
          // Helper to get initials
          const generateInitials = (name: string, email: string) => {
            if (name && name.trim()) {
              return name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
            } else if (email && email.trim()) {
              return email.substring(0, 2).toUpperCase();
            }
            return "U";
          };
          const name = getDisplayName(userData);
          const initials = generateInitials(name, userData.email);
          set({
            user: { ...userData, name, initials },
            isAuthenticated: true,
            currentRole: userData.primaryRole,
            appState: userData.isOnboarded ? "dashboard" : "onboarding"
          });
          if (navigate) {
            navigate(userData.isOnboarded ? '/app' : '/onboarding');
          }
        },
        handleLogout: () => {
          const { navigate } = get();
          // Call API logout
          authAPI.logout().catch(console.error);
          // Clear tokens
          import('../api/auth').then(({ tokenManager }) => {
            tokenManager.clearTokens();
          });
          // Clear state
          set({
            user: null,
            isAuthenticated: false,
            currentRole: "admin",
            appState: "landing",
            activeView: "dashboard"
          });
          if (navigate) navigate('/');
        },
        handleOnboardingComplete: () => {
          const { navigate } = get();
          set({ appState: "dashboard" });
          if (navigate) navigate('/app');
        },
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          currentRole: state.currentRole,
          activeView: state.activeView,
        }),
      }
    )
  )
);
