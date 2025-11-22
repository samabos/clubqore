import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TeamManager } from '@/modules/team/types';
import { loadAvailablePersonnel } from '@/modules/team/actions/team-actions';

export interface PersonnelState {
  // Data
  availablePersonnel: TeamManager[];
  isLoading: boolean;
  lastLoaded: number | null;
  clubId: number | null;
  
  // Cache settings
  cacheExpiryMs: number; // 5 minutes
  
  // Actions
  loadPersonnel: (clubId: number, forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

export const usePersonnelStore = create<PersonnelState>()(
  devtools(
    (set, get) => ({
      // Initial state
      availablePersonnel: [],
      isLoading: false,
      lastLoaded: null,
      clubId: null,
      cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
      
      // Actions
      loadPersonnel: async (clubId: number, forceRefresh = false) => {
        const state = get();
        
        // Check if we already have valid cached data for this club
        if (!forceRefresh && 
            state.clubId === clubId && 
            state.isCacheValid() && 
            state.availablePersonnel.length > 0) {
          return;
        }
        
        // Prevent multiple simultaneous loads
        if (state.isLoading) {
          return;
        }
        
        set({ isLoading: true });
        
        try {
          const personnel = await loadAvailablePersonnel(clubId);
          set({
            availablePersonnel: personnel,
            lastLoaded: Date.now(),
            clubId,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error loading personnel:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      clearCache: () => {
        set({
          availablePersonnel: [],
          lastLoaded: null,
          clubId: null,
        });
      },
      
      isCacheValid: () => {
        const state = get();
        if (!state.lastLoaded) return false;
        return Date.now() - state.lastLoaded < state.cacheExpiryMs;
      },
    }),
    {
      name: 'personnel-store',
    }
  )
);

// Convenience hook
export const usePersonnel = () => {
  const {
    availablePersonnel,
    isLoading,
    loadPersonnel,
    clearCache,
    isCacheValid,
  } = usePersonnelStore();
  
  return {
    availablePersonnel,
    isLoading,
    loadPersonnel,
    clearCache,
    isCacheValid,
  };
};
