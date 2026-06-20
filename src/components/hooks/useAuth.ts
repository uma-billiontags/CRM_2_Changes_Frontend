// src/hooks/useAuth.ts
import { useMemo } from 'react';

export const useAuth = () => {
  const user = useMemo(() => {
    return {
      id: localStorage.getItem('user_id'),
      role: localStorage.getItem('user_role')?.toLowerCase(),
      email: localStorage.getItem('user_email'),
      client_id: localStorage.getItem('client_id'),
      username: localStorage.getItem('user_name'),
    };
  }, []);

  const isAdmin = ['admin', 'superadmin', 'creative_team', 'campaign_team'].includes(user.role || '');
  const isClient = user.role === 'client';

  return { user, isAdmin, isClient };
};