import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fetchClubMembers } from '@/modules/member/actions/member-actions';
import type { ClubMember } from '@/modules/member/types/component-types';

export interface MembersState {
  // Data
  members: ClubMember[];
  isLoading: boolean;
  lastLoaded: number | null;

  // Cache settings
  cacheExpiryMs: number; // default 5 minutes

  // Actions
  loadMembers: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

export const useMembersStore = create<MembersState>()(
  devtools(
    (set, get) => ({
      // Initial state
      members: [],
      isLoading: false,
      lastLoaded: null,
      cacheExpiryMs: 5 * 60 * 1000,

      // Actions
      loadMembers: async (forceRefresh = false) => {
        const state = get();

        if (!forceRefresh && state.isCacheValid() && state.members.length > 0) {
          return;
        }

        if (state.isLoading) {
          return;
        }

        set({ isLoading: true });

        try {
          const members = await fetchClubMembers();
          // Debug: inspect team-related fields to verify backend shape
          if (members && members.length > 0) {
            const m = members[0] as unknown as {
              id?: number;
              team_id?: number;
              teamId?: number;
              team?: { id?: number; name?: string };
              assigned_team_id?: number;
              team_name?: string;
            };
          }
          set({
            members,
            lastLoaded: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          console.error('Error loading members:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      clearCache: () => {
        set({
          members: [],
          lastLoaded: null,
        });
      },

      isCacheValid: () => {
        const { lastLoaded, cacheExpiryMs } = get();
        if (!lastLoaded) return false;
        return Date.now() - lastLoaded < cacheExpiryMs;
      },
    }),
    { name: 'members-store' }
  )
);

// Convenience hook
export const useMembers = () => {
  const { members, isLoading, loadMembers, clearCache, isCacheValid } = useMembersStore();

  return {
    members,
    isLoading,
    loadMembers,
    clearCache,
    isCacheValid,
  };
};


