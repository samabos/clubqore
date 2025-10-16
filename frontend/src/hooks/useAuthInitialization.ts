import { useEffect } from 'react';
import { useAppStore } from './index';
import { authAPI, tokenManager } from '../api/auth';
import { clubsAPI } from '@/api/clubs';

export const useAuthInitialization = () => {
  const { setUser, setUserClub, setClubDataLoaded } = useAppStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();
      
      console.log('🔄 Auth initialization - Token exists:', !!token);
      console.log('🔄 Auth initialization - Refresh exists:', !!refreshToken);
      
      if (token) {
        try {
          // Verify token and get user data
          console.log('✅ Verifying token with backend...');
          const userData = await authAPI.getCurrentUser();
          console.log('✅ Token valid, user data received');
          setUser(userData);
          
          // For club managers, check if they have a club
          if (userData.primaryRole === 'club_manager') {
            try {
              console.log('✅ User is a club manager, checking for club...');
              const clubDetails = await clubsAPI.getMyClub();
              console.log('✅ Club details received:', clubDetails);
              setUserClub(clubDetails);
            } catch {
              console.log('ℹ️ Club manager has no club yet');
              setUserClub(null);
            }
          } else if (userData.clubId) {
            console.log('✅ User is part of a club:', userData.clubId);
            // Fetch club details for other roles
            const clubDetails = await clubsAPI.getClub(userData.clubId);
            console.log('✅ Club details received:', clubDetails);
            setUserClub(clubDetails);
          }
          
          // Mark club data as loaded
          setClubDataLoaded(true);
        } catch (error) {
          // Token is invalid, clear everything
          console.error('❌ Token invalid, clearing auth state:', error);
          tokenManager.clearTokens();
          setUser(null);
        }
      } else {
        // No tokens exist, ensure user state is cleared
        console.log('ℹ️ No tokens found, ensuring clean state');
        setUser(null);
        setClubDataLoaded(true); // Mark as loaded even when no user
      }
    };

    initializeAuth();
  }, [setUser, setUserClub, setClubDataLoaded]); // Include all dependencies
};
