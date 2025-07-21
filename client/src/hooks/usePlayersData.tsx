import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';

export function usePlayersData() {
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchPlayers = async function() {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPlayers();
  }, []);

  return { players, loading, refetch: fetchPlayers };
}
