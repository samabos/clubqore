import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from './index';
import { useAuth } from '../stores/authStore';
import type { AppStore } from '../stores/appStore';

export const useNavigationSetup = () => {
  const navigate = useNavigate();
  const setNavigate = useAppStore((state: AppStore) => state.setNavigate);
  const { setNavigate: setAuthNavigate } = useAuth();

  useEffect(() => {
    setNavigate(navigate);
    setAuthNavigate(navigate); // Also set navigation for auth store
  }, [navigate, setNavigate, setAuthNavigate]);
};
