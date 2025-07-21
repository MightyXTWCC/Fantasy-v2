import * as React from 'react';

export function useLeaderboardData() {
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchLeaderboard = async function() {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLeaderboard();
  }, []);

  return { leaderboard, loading, refetch: fetchLeaderboard };
}
