import { create } from 'zustand';

/**
 * SIMPLIFIED APP STORE
 *
 * Minimal app-level state for UI concerns.
 * Authentication is handled by AuthStore.
 *
 * For auth state, use: import { useAuth } from "@/stores/authStore";
 */
export interface AppStore {
  // UI state
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;

  // Navigation helper (set by router)
  navigate?: (path: string) => void;
  setNavigate: (navigate: (path: string) => void) => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  // Initial State
  isMobile: false,
  navigate: undefined,

  // Actions
  setIsMobile: (isMobile: boolean) => set({ isMobile }),
  setNavigate: (navigate: (path: string) => void) => set({ navigate }),
}));
