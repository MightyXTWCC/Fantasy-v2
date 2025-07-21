import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export function H2HManagement() {
  const { token } = useAuth();
  const [matchups, setMatchups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMatchups = async function() {
      if (!token) return;
      
      try {
        const response = await fetch('/api/admin/h2h-matchups', {
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

    fetchMatchups();
  }, [token]);

  if (loading) {
    return <div>Loading H2H matchups...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">All Head-to-Head Matchups</h3>
      
      {matchups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No head-to-head matchups created yet.</p>
          </CardContent>
        </Card>
      ) : (
        matchups.map((matchup) => (
          <Card key={matchup.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{matchup.name}</span>
                <Badge variant={
                  matchup.status === 'completed' ? 'default' : 
                  matchup.status === 'active' ? 'secondary' : 'outline'
                }>
                  {matchup.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Match:</strong> {matchup.match_name}</p>
                <p><strong>Date:</strong> {new Date(matchup.match_date).toLocaleDateString()}</p>
                <p><strong>Created:</strong> {new Date(matchup.created_at).toLocaleDateString()}</p>
                
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className="font-semibold">{matchup.user1_name}</p>
                      <p className="text-2xl font-bold">{matchup.user1_score}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-muted-foreground">VS</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-semibold">{matchup.user2_name}</p>
                      <p className="text-2xl font-bold">{matchup.user2_score}</p>
                    </div>
                  </div>
                  
                  {matchup.winner_name && (
                    <div className="text-center mt-2">
                      <Badge variant="default">Winner: {matchup.winner_name}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
