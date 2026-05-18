import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/apiClient';
import type { UserResponse } from '@/types/api';

export function useCurrentUser() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { user, isLoading };
}
