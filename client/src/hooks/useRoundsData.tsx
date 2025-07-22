import * as React from 'react';

export function useRoundsData() {
  const [rounds, setRounds] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRounds = async function() {
    try {
      const response = await fetch('/api/rounds');
      const data = await response.json();
      setRounds(data);
    } catch (error) {
      console.error('Error fetching rounds:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRounds();
  }, []);

  return { rounds, loading, refetch: fetchRounds };
}
