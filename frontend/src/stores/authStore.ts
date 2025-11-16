import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AuthUser, UserRole } from '@/types/auth';
import { authService, SignInData, SignUpData } from '@/services/authService';
import { tokenManager } from '@/api/secureAuth';
import { Club } from '@/types/club';

export interface AuthState {
  // Core auth state
  user: AuthUser | null;
  isAuthenticated: boolean;
  
  // Token state
  hasToken: boolean;
  tokenExpiresAt: number | null;
  isTokenExpiringSoon: boolean;
  
  // Related data
  userClub: Club | null;
  clubDataLoaded: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions - Authentication
  signIn: (credentials: SignInData) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;

  // Actions - Token management
  refreshToken: () => Promise<void>;
  checkTokenValidity: () => boolean;
  startTokenRefresh: () => void;
  stopTokenRefresh: () => void;

  // Actions - State management
  setUser: (user: AuthUser | null) => void;
  setUserClub: (club: Club | null) => void;
  setClubDataLoaded: (loaded: boolean) => void;

  // Actions - Navigation callback (set by router)
  navigate?: (path: string) => void;
  setNavigate: (navigate: (path: string) => void) => void;

  // Helper methods
  loadClubData: (user: AuthUser) => Promise<void>;
  reloadClubData: () => Promise<void>;
  updateTokenState: () => void;
}

const getDisplayName = (user: AuthUser): string => {
  if (!user) return "User";
  const fullName =
    user.profile?.fullName ||
    `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim();
  if (fullName && fullName.trim()) return fullName;
  if (user.email && user.email.trim()) return user.email.split("@")[0];
  return "User";
};

const generateInitials = (name: string, email: string): string => {
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

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        hasToken: !!tokenManager.getAccessToken(),
        tokenExpiresAt: null,
        isTokenExpiringSoon: false,
        userClub: null,
        clubDataLoaded: false,
        isLoading: false,
        error: null,

        // Authentication actions
        signIn: async (credentials: SignInData) => {
          set({ isLoading: true, error: null });
          
          try {
            const { user } = await authService.signIn(credentials);
            
            // Enhance user object with display properties
            const name = getDisplayName(user);
            const initials = generateInitials(name, user.email);
            const enhancedUser = { ...user, name, initials };
            
            set({ 
              user: enhancedUser, 
              isAuthenticated: true, 
              isLoading: false 
            });

            // Update token state
            get().updateTokenState();

            // Start proactive token refresh
            get().startTokenRefresh();

            // Load club data if needed
            console.log('🔄 signIn: About to call loadClubData for user:', enhancedUser.roles);
            await get().loadClubData(enhancedUser);
            console.log('🔄 signIn: loadClubData completed');
            
            const currentState = get();
            console.log('🔄 signIn: Final state after loadClubData:', { 
              userClub: currentState.userClub, 
              clubDataLoaded: currentState.clubDataLoaded 
            });

            // Navigate based on onboarding status
            const { navigate } = get();
            if (navigate) {
              navigate(user.isOnboarded ? '/app' : '/onboarding');
            }
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
            set({ 
              error: errorMessage, 
              isLoading: false 
            });
            throw error;
          }
        },

        signUp: async (userData: SignUpData) => {
          set({ isLoading: true, error: null });
          
          try {
            const { user } = await authService.signUp(userData);
            
            // Enhance user object with display properties
            const name = getDisplayName(user);
            const initials = generateInitials(name, user.email);
            const enhancedUser = { ...user, name, initials };
            
            set({ 
              user: enhancedUser, 
              isAuthenticated: true, 
              isLoading: false 
            });

            // Update token state
            get().updateTokenState();

            // Start proactive token refresh
            get().startTokenRefresh();

            // Load club data if needed
            await get().loadClubData(enhancedUser);

            // Navigate based on onboarding status
            const { navigate } = get();
            if (navigate) {
              navigate(user.isOnboarded ? '/app' : '/onboarding');
            }
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
            set({ 
              error: errorMessage, 
              isLoading: false 
            });
            throw error;
          }
        },

        signOut: async () => {
          set({ isLoading: true });
          
          // Stop token refresh
          get().stopTokenRefresh();
          
          try {
            await authService.logout();
          } catch (error) {
            console.warn('Logout error:', error);
          } finally {
            // Always clear state regardless of API success/failure
            set({
              user: null,
              isAuthenticated: false,
              hasToken: false,
              tokenExpiresAt: null,
              isTokenExpiringSoon: false,
              userClub: null,
              clubDataLoaded: false,
              isLoading: false,
              error: null
            });

            const { navigate } = get();
            if (navigate) {
              navigate('/');
            }
          }
        },

        getCurrentUser: async () => {
          set({ isLoading: true, error: null });
          console.log('🔄 getCurrentUser: Starting, preserving club data...');
          
          try {
            const user = await authService.getCurrentUser();
            
            // Enhance user object with display properties
            const name = getDisplayName(user);
            const initials = generateInitials(name, user.email);
            const enhancedUser = { ...user, name, initials };
            
            set({ 
              user: enhancedUser, 
              isAuthenticated: true, 
              isLoading: false 
            });

            // Load club data if needed
            await get().loadClubData(enhancedUser);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get current user';
            set({ 
              user: null,
              isAuthenticated: false,
              error: errorMessage, 
              isLoading: false 
            });
            throw error;
          }
        },

        clearError: () => set({ error: null }),

        // State management actions
        setUser: (user) => {
          set({ user, isAuthenticated: !!user });
        },

        setUserClub: (club) => set({ userClub: club }),
        
        setClubDataLoaded: (loaded) => set({ clubDataLoaded: loaded }),

        setNavigate: (navigate) => set({ navigate }),

        // Token management actions
        refreshToken: async () => {
          const refreshToken = tokenManager.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          set({ isLoading: true, error: null });
          
          try {
            const result = await authService.refreshToken(refreshToken);
            tokenManager.setTokens(result.accessToken, result.refreshToken);
            get().updateTokenState();
            set({ isLoading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
            set({ error: errorMessage, isLoading: false });
            // Clear auth state on refresh failure
            get().signOut();
            throw error;
          }
        },

        checkTokenValidity: () => {
          return tokenManager.isTokenValid();
        },

        startTokenRefresh: () => {
          tokenManager.startProactiveRefresh();
        },

        stopTokenRefresh: () => {
          tokenManager.stopProactiveRefresh();
        },

        updateTokenState: () => {
          const hasToken = !!tokenManager.getAccessToken();
          const timeUntilExpiration = tokenManager.getTimeUntilExpiration();
          const tokenExpiresAt = timeUntilExpiration > 0 ? Date.now() + timeUntilExpiration : null;
          const isTokenExpiringSoon = tokenManager.isTokenExpiringSoon();
          
          set({ 
            hasToken, 
            tokenExpiresAt, 
            isTokenExpiringSoon,
            // Update authentication state based on token presence
            isAuthenticated: hasToken && get().user !== null
          });
        },

        // Helper method for loading club data
        loadClubData: async (user: AuthUser) => {
          console.log('🔄 loadClubData START - called with user:', { 
            roles: user.roles, 
            clubId: user.clubId, 
            fullUser: user 
          });
          if (user.roles.some(roleInfo => roleInfo === 'club_manager')) {
            try {
              console.log('🔄 Loading club data for club manager...');
              const { getMyClub } = await import('@/modules/club/actions');
              const clubDetails = await getMyClub();
              console.log('🔄 getMyClub returned:', clubDetails);
              if (clubDetails) {
                console.log('✅ Club data loaded, setting state:', clubDetails);
                set({ userClub: clubDetails, clubDataLoaded: true });
                console.log('✅ State updated - userClub set, clubDataLoaded: true');
                // Verify state was set
                const currentState = get();
                console.log('🔍 Verifying state after update:', { 
                  userClub: currentState.userClub, 
                  clubDataLoaded: currentState.clubDataLoaded 
                });
              } else {
                console.log('ℹ️ No club found (clubDetails is falsy)');
                set({ userClub: null, clubDataLoaded: true });
              }
            } catch (error) {
              console.log('❌ Error loading club data:', error);
              set({ userClub: null, clubDataLoaded: true });
            }
          } else if (user.clubId) {
            try {
              console.log('🔄 Loading club data for user with clubId:', user.clubId);
              const { getClub } = await import('@/modules/club/actions');
              const clubDetails = await getClub(user.clubId);
              console.log('✅ Club data loaded:', clubDetails);
              set({ userClub: clubDetails, clubDataLoaded: true });
            } catch (error) {
              console.log('ℹ️ Could not load club data:', error);
              set({ userClub: null, clubDataLoaded: true });
            }
          } else {
            console.log('ℹ️ User has no club role or clubId, setting userClub: null and clubDataLoaded: true');
            set({ userClub: null, clubDataLoaded: true });
          }
          console.log('🔄 loadClubData END - completed');
          // Log final state
          const finalState = get();
          console.log('🔄 loadClubData END - final state:', { 
            userClub: finalState.userClub, 
            clubDataLoaded: finalState.clubDataLoaded 
          });
        },

        // Helper method to reload club data for current user
        reloadClubData: async () => {
          const { user } = get();
          if (user) {
            console.log('🔄 reloadClubData: Reloading club data for current user');
            set({ clubDataLoaded: false });
            await get().loadClubData(user);
          } else {
            console.log('⚠️ reloadClubData: No user found, cannot reload club data');
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          userClub: state.userClub,
          clubDataLoaded: state.clubDataLoaded,
        }),
      }
    )
  )
);

// Convenience hook for authentication
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    hasToken,
    tokenExpiresAt,
    isTokenExpiringSoon,
    userClub,
    clubDataLoaded,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    clearError,
    refreshToken,
    checkTokenValidity,
    startTokenRefresh,
    stopTokenRefresh,
    updateTokenState,
    setNavigate,
    setUserClub,
    setClubDataLoaded,
    reloadClubData,
  } = useAuthStore();

  return {
    // Auth state
    user,
    isAuthenticated,
    userClub,
    clubDataLoaded,
    isLoading,
    error,
    
    // Token state
    hasToken,
    tokenExpiresAt,
    isTokenExpiringSoon,
    
    // Auth actions
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    clearError,
    
    // Token actions
    refreshToken,
    checkTokenValidity,
    startTokenRefresh,
    stopTokenRefresh,
    updateTokenState,
    
    // Navigation
    setNavigate,
    
    // Club data management
    setUserClub,
    setClubDataLoaded,
    reloadClubData,
    
    // Derived state
    currentRole: user?.roles || [] as UserRole[],
    
    // Token utilities
    tokenExpiresIn: tokenExpiresAt ? Math.max(0, tokenExpiresAt - Date.now()) : 0,
    tokenExpiresInMinutes: tokenExpiresAt ? Math.max(0, Math.ceil((tokenExpiresAt - Date.now()) / 60000)) : 0,
  };
};