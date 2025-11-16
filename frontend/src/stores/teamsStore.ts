import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fetchTeams } from '@/modules/team/actions';
import type { Team } from '@/modules/team/types';

export interface TeamsState {
  teams: Team[];
  isLoading: boolean;
  lastLoaded: number | null;
  cacheExpiryMs: number; // 5 minutes
  loadTeams: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

export const useTeamsStore = create<TeamsState>()(
  devtools(
    (set, get) => ({
      teams: [],
      isLoading: false,
      lastLoaded: null,
      cacheExpiryMs: 5 * 60 * 1000,

      loadTeams: async (forceRefresh = false) => {
        const state = get();
        if (!forceRefresh && state.isCacheValid() && state.teams.length > 0) {
          return;
        }
        if (state.isLoading) return;

        set({ isLoading: true });
        try {
          const teams = await fetchTeams();
          set({ teams, lastLoaded: Date.now(), isLoading: false });
        } catch (error) {
          console.error('Error loading teams:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      clearCache: () => set({ teams: [], lastLoaded: null }),

      isCacheValid: () => {
        const { lastLoaded, cacheExpiryMs } = get();
        if (!lastLoaded) return false;
        return Date.now() - lastLoaded < cacheExpiryMs;
      },
    }),
    { name: 'teams-store' }
  )
);

export const useTeams = () => {
  const { teams, isLoading, loadTeams, clearCache, isCacheValid } = useTeamsStore();
  return { teams, isLoading, loadTeams, clearCache, isCacheValid };
};


