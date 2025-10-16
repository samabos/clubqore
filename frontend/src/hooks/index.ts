import { useEffect } from 'react';
import { useAppStore, useUIStore } from '../store';

// Re-export the stores for convenience
export { useAppStore, useUIStore };

// Hook for authentication state
export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    handleLogin, 
    handleLogout, 
    currentRole, 
    handleRoleChange 
  } = useAppStore();

  return {
    user,
    isAuthenticated,
    currentRole,
    login: handleLogin,
    logout: handleLogout,
    changeRole: handleRoleChange,
  };
};

// Hook for navigation state
export const useNavigation = () => {
  const {
    activeView,
    setActiveView,
    appState,
    setAppState,
    handleBackToLanding,
    handleGetStarted,
    handleOnboardingComplete,
  } = useAppStore();

  return {
    activeView,
    appState,
    setActiveView,
    setAppState,
    backToLanding: handleBackToLanding,
    getStarted: handleGetStarted,
    completeOnboarding: handleOnboardingComplete,
  };
};

// Hook for responsive design
export const useResponsive = () => {
  const { isMobile, setIsMobile } = useAppStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  return { isMobile };
};

// Hook for UI state
export const useUI = () => {
  const {
    theme,
    setTheme,
    notifications,
    addNotification,
    markNotificationRead,
    removeNotification,
    clearAllNotifications,
    loading,
    setLoading,
    modals,
    openModal,
    closeModal,
    closeAllModals,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
  } = useUIStore();

  return {
    theme,
    setTheme,
    notifications,
    addNotification,
    markNotificationRead,
    removeNotification,
    clearAllNotifications,
    loading,
    setLoading,
    modals,
    openModal,
    closeModal,
    closeAllModals,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
  };
};

// Hook for sidebar state
export const useSidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return {
    isOpen: sidebarOpen,
    open: () => setSidebarOpen(true),
    close: () => setSidebarOpen(false),
    toggle: () => setSidebarOpen(!sidebarOpen),
  };
};

// Authentication hooks
export { useAuthentication } from './useAuthentication';
