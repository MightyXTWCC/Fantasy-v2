import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useH2HData() {
  const { token } = useAuth();
  const [matchups, setMatchups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchMatchups = async function() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/h2h-matchups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMatchups(data);
    } catch (error) {
      console.error('Error fetching H2H matchups:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMatchups();
  }, [token]);

  return { matchups, loading, refetch: fetchMatchups };
}
