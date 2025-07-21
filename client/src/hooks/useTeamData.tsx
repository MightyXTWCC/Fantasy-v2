import * as React from 'react';

export function useTeamData(userId: number) {
  const [team, setTeam] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchTeam = async function() {
    try {
      const response = await fetch(`/api/user/${userId}/team`);
      const data = await response.json();
      setTeam(data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTeam();
  }, [userId]);

  return { team, loading, refetch: fetchTeam };
}
