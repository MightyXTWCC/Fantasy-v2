import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTeamData } from '@/hooks/useTeamData';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function MyTeam() {
  const { team, loading, refetch } = useTeamData();
  const { user, refetchUser } = useUserData();
  const { token } = useAuth();

  const handleSellPlayer = async function(playerId: number) {
    if (!token) return;

    try {
      const response = await fetch('/api/sell-player', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ playerId })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message, {
          duration: 4000,
          position: 'top-center',
        });
        refetch();
        refetchUser();
      } else {
        const error = await response.json();
        toast.error(error.error, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error selling player:', error);
      toast.error('Failed to sell player', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  const handleSetCaptain = async function(playerId: number) {
    if (!token) return;

    try {
      const response = await fetch('/api/set-captain', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ playerId })
      });
      
      if (response.ok) {
        toast.success('Captain set successfully!', {
          duration: 3000,
          position: 'top-center',
        });
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.error, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error setting captain:', error);
      toast.error('Failed to set captain', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  if (loading) {
    return <div>Loading team...</div>;
  }

  const totalValue = team.reduce((sum, player) => sum + (player.current_price || 0), 0);
  const totalPoints = team.reduce((sum, player) => {
    let points = player.total_points || 0;
    if (player.is_captain) points *= 2;
    return sum + points;
  }, 0);

  return (
    <div>
      <Toaster />
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Available Budget</p>
              <p className="text-2xl font-bold">${user?.budget?.toLocaleString() || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Team Value</p>
              <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Players</p>
              <p className="text-2xl font-bold">{team.length}/5</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold">{totalPoints}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {team.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No players in your team yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Go to the Players page to buy some players!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((player) => (
            <Card key={player.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{player.name}</span>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">{player.position}</Badge>
                    {player.is_captain && (
                      <Badge variant="default">Captain</Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Team:</strong> {player.team}</p>
                  <p><strong>Bought for:</strong> ${player.purchase_price?.toLocaleString()}</p>
                  <p><strong>Current Value:</strong> ${player.current_price?.toLocaleString()}</p>
                  <p><strong>Points:</strong> {player.total_points} {player.is_captain && '(x2)'}</p>
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSetCaptain(player.player_id)}
                      disabled={player.is_captain}
                    >
                      {player.is_captain ? 'Captain' : 'Make Captain'}
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleSellPlayer(player.player_id)}
                    >
                      Sell
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
