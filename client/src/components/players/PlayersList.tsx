import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlayersData } from '@/hooks/usePlayersData';
import { useUserData } from '@/hooks/useUserData';

export function PlayersList() {
  const { players, loading, refetch } = usePlayersData();
  const { user, refetchUser } = useUserData(1); // Using user ID 1 for demo

  const handleBuyPlayer = async function(playerId: number) {
    try {
      const response = await fetch(`/api/user/1/buy-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      
      if (response.ok) {
        refetch();
        refetchUser();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error buying player:', error);
    }
  };

  if (loading) {
    return <div>Loading players...</div>;
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <p className="text-lg font-semibold">
          Budget: ${user?.budget?.toLocaleString() || 0}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <Card key={player.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{player.name}</span>
                <Badge variant="secondary">{player.position}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Team:</strong> {player.team}</p>
                <p><strong>Price:</strong> ${player.current_price.toLocaleString()}</p>
                <p><strong>Points:</strong> {player.total_points}</p>
                <p><strong>Matches:</strong> {player.matches_played}</p>
                <Button 
                  className="w-full mt-4"
                  onClick={() => handleBuyPlayer(player.id)}
                  disabled={!user || user.budget < player.current_price}
                >
                  Buy Player
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
