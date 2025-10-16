import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from './index';
import type { AppStore } from '../store';

export const useNavigationSetup = () => {
  const navigate = useNavigate();
  const setNavigate = useAppStore((state: AppStore) => state.setNavigate);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);
};
