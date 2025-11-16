import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UserRole } from '../types/auth';

export type AppState = 'landing' | 'auth' | 'onboarding' | 'dashboard';

/**
 * SIMPLIFIED APP STORE
 * 
 * This store now focuses only on app-level state, not authentication.
 * Authentication is handled by the dedicated AuthStore.
 * 
 * For auth state, use: import { useAuth } from "@/stores/authStore";
 */
export interface AppStore {
  // App state
  appState: AppState;
  currentRole: UserRole;
  activeView: string;
  
  // UI state
  isMobile: boolean;
  sidebarOpen: boolean;

  // Actions
  setAppState: (state: AppState) => void;
  setCurrentRole: (role: UserRole) => void;
  setActiveView: (view: string) => void;
  setIsMobile: (isMobile: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setNavigate: (navigate: (path: string) => void) => void;

  // Handlers
  handleGetStarted: () => void;
  handleBackToLanding: () => void;
  handleRoleChange: (role: UserRole) => void;
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
        currentRole: "club_manager",
        activeView: "dashboard",
        isMobile: false,
        sidebarOpen: false,

        // Actions
        setAppState: (state) => set({ appState: state }),
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
          // Simplified role change without user dependency
          set({ currentRole: role });
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
          currentRole: state.currentRole,
          activeView: state.activeView,
        }),
      }
    )
  )
);
