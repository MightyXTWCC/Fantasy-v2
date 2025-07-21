import * as React from 'react';

export function useMatchesData() {
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchMatches = async function() {
    try {
      const response = await fetch('/api/matches');
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMatches();
  }, []);

  return { matches, loading, refetch: fetchMatches };
}
