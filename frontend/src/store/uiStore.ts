import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIStore {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: Date;
    read: boolean;
  }>;
  addNotification: (notification: Omit<UIStore['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Loading states
  loading: {
    auth: boolean;
    dashboard: boolean;
    profile: boolean;
    [key: string]: boolean;
  };
  setLoading: (key: string, loading: boolean) => void;
  
  // Modals and dialogs
  modals: {
    profile: boolean;
    settings: boolean;
    help: boolean;
    [key: string]: boolean;
  };
  openModal: (modal: string) => void;
  closeModal: (modal: string) => void;
  closeAllModals: () => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      // Theme
      theme: 'system',
      setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
      
      // Notifications
      notifications: [],
      addNotification: (notification: Omit<UIStore['notifications'][0], 'id' | 'timestamp' | 'read'>) => {
        const newNotification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
        };
        set((state: UIStore) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep only last 50
        }));
      },
      markNotificationRead: (id: string) => {
        set((state: UIStore) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },
      removeNotification: (id: string) => {
        set((state: UIStore) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      clearAllNotifications: () => set({ notifications: [] }),
      
      // Loading states
      loading: {
        auth: false,
        dashboard: false,
        profile: false,
      },
      setLoading: (key: string, loading: boolean) => {
        set((state: UIStore) => ({
          loading: { ...state.loading, [key]: loading }
        }));
      },
      
      // Modals
      modals: {
        profile: false,
        settings: false,
        help: false,
      },
      openModal: (modal: string) => {
        set((state: UIStore) => ({
          modals: { ...state.modals, [modal]: true }
        }));
      },
      closeModal: (modal: string) => {
        set((state: UIStore) => ({
          modals: { ...state.modals, [modal]: false }
        }));
      },
      closeAllModals: () => {
        set((state: UIStore) => {
          const modals = { ...state.modals };
          Object.keys(modals).forEach(key => modals[key] = false);
          return { modals };
        });
      },
      
      // Search
      searchQuery: '',
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      searchResults: [],
      setSearchResults: (results: any[]) => set({ searchResults: results }),
    }),
    { name: 'ClubQore UI Store' }
  )
);
