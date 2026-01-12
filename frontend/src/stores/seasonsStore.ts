import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fetchSeasons, fetchActiveSeason } from '@/modules/season/actions/season-actions';
import type { Season } from '@/types/season';

export interface SeasonsState {
  seasons: Season[];
  activeSeason: Season | null;
  isLoading: boolean;
  lastLoaded: number | null;
  cacheExpiryMs: number; // 30 seconds - minimal caching for fresh data
  loadSeasons: (forceRefresh?: boolean) => Promise<void>;
  loadActiveSeason: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

export const useSeasonsStore = create<SeasonsState>()(
  devtools(
    (set, get) => ({
      seasons: [],
      activeSeason: null,
      isLoading: false,
      lastLoaded: null,
      cacheExpiryMs: 30 * 1000, // 30 seconds for fresh data

      loadSeasons: async (forceRefresh = false) => {
        const state = get();
        if (!forceRefresh && state.isCacheValid() && state.seasons.length > 0) {
          return;
        }
        if (state.isLoading) return;

        set({ isLoading: true });
        try {
          const seasons = await fetchSeasons();
          set({ seasons, lastLoaded: Date.now(), isLoading: false });
        } catch (error) {
          console.error('Error loading seasons:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      loadActiveSeason: async (forceRefresh = false) => {
        const state = get();
        if (!forceRefresh && state.isCacheValid() && state.activeSeason) {
          return;
        }
        if (state.isLoading) return;

        set({ isLoading: true });
        try {
          const activeSeason = await fetchActiveSeason();
          set({ activeSeason, lastLoaded: Date.now(), isLoading: false });
        } catch (error) {
          console.error('Error loading active season:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      clearCache: () => set({ seasons: [], activeSeason: null, lastLoaded: null }),

      isCacheValid: () => {
        const { lastLoaded, cacheExpiryMs } = get();
        if (!lastLoaded) return false;
        return Date.now() - lastLoaded < cacheExpiryMs;
      },
    }),
    { name: 'seasons-store' }
  )
);

export const useSeasons = () => {
  const { seasons, activeSeason, isLoading, loadSeasons, loadActiveSeason, clearCache, isCacheValid } = useSeasonsStore();
  return { seasons, activeSeason, isLoading, loadSeasons, loadActiveSeason, clearCache, isCacheValid };
};
