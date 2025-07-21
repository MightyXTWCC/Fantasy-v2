import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useUserData() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const refetchUser = async function() {
    // User data is managed by the auth context
    return;
  };

  return { user, loading, refetchUser };
}
