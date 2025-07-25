import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTeamData } from '@/hooks/useTeamData';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { PlayerCard } from '@/components/team/PlayerCard';
import { SubstituteBench } from '@/components/team/SubstituteBench';
import { RoundStatus } from '@/components/rounds/RoundStatus';
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
        if (response.status === 423) {
          toast.error('Team changes are locked during active round', {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          toast.error(error.error, {
            duration: 4000,
            position: 'top-center',
          });
        }
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
        if (response.status === 423) {
          toast.error('Team changes are locked during active round', {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          toast.error(error.error, {
            duration: 4000,
            position: 'top-center',
          });
        }
      }
    } catch (error) {
      console.error('Error setting captain:', error);
      toast.error('Failed to set captain', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  const handleSubstitute = async function(mainPlayerId: number, substitutePlayerId: number) {
    if (!token) return;

    try {
      const response = await fetch('/api/substitute-player', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mainPlayerId, substitutePlayerId })
      });
      
      if (response.ok) {
        toast.success('Player substituted successfully!', {
          duration: 3000,
          position: 'top-center',
        });
        refetch();
      } else {
        const error = await response.json();
        if (response.status === 423) {
          toast.error('Team changes are locked during active round', {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          toast.error(error.error, {
            duration: 4000,
            position: 'top-center',
          });
        }
      }
    } catch (error) {
      console.error('Error substituting player:', error);
      toast.error('Failed to substitute player', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  if (loading) {
    return <div>Loading team...</div>;
  }

  // Separate main team and substitutes
  const mainTeam = team.filter(player => !player.is_substitute);
  const substitutes = team.filter(player => player.is_substitute);
  
  const totalValue = team.reduce((sum, player) => sum + (player.current_price || 0), 0);
  const totalCurrentPoints = mainTeam.reduce((sum, player) => {
    let points = player.current_round_points || 0;
    if (player.is_captain) points *= 2;
    return sum + points;
  }, 0);
  const totalOverallPoints = mainTeam.reduce((sum, player) => {
    let points = (player.total_points || 0) + (player.current_round_points || 0);
    if (player.is_captain) points *= 2;
    return sum + points;
  }, 0);

  // Check team composition requirements and organize by position - Updated for 11 players total
  const positionCounts = {
    'Batsman': { main: 0, sub: 0 },
    'Bowler': { main: 0, sub: 0 },
    'All-rounder': { main: 0, sub: 0 },
    'Wicket-keeper': { main: 0, sub: 0 }
  };

  const playersByPosition = {
    'Wicket-keeper': { main: [], sub: [] },
    'Batsman': { main: [], sub: [] },
    'All-rounder': { main: [], sub: [] },
    'Bowler': { main: [], sub: [] }
  };

  // Count and organize players by position and role
  team.forEach(player => {
    const role = player.is_substitute ? 'sub' : 'main';
    positionCounts[player.position][role]++;
    playersByPosition[player.position][role].push(player);
  });

  // Updated team completion check for 11 players total (7 main + 4 subs)
  const isMainTeamComplete = positionCounts['Batsman'].main === 2 && 
                            positionCounts['Bowler'].main === 2 && 
                            positionCounts['All-rounder'].main === 2 && 
                            positionCounts['Wicket-keeper'].main === 1;

  const isFullTeamComplete = isMainTeamComplete &&
                           positionCounts['Batsman'].sub === 1 &&
                           positionCounts['Bowler'].sub === 1 &&
                           positionCounts['All-rounder'].sub === 1 &&
                           positionCounts['Wicket-keeper'].sub === 1;

  return (
    <div>
      <Toaster />
      
      {/* Round Status */}
      <RoundStatus />
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Available Budget</p>
              <p className="text-2xl font-bold">${user?.budget?.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{team.length}/11</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Round Points</p>
              <p className="text-2xl font-bold">{totalCurrentPoints} ({totalOverallPoints})</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Composition Status - Updated for 11 players total */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Composition (Main Team + Substitutes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Batsmen</p>
              <p className={`text-lg font-bold ${positionCounts['Batsman'].main === 2 ? 'text-green-600' : 'text-red-600'}`}>
                {positionCounts['Batsman'].main}/2
              </p>
              <p className="text-xs text-muted-foreground">
                Sub: {positionCounts['Batsman'].sub}/1
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Bowlers</p>
              <p className={`text-lg font-bold ${positionCounts['Bowler'].main === 2 ? 'text-green-600' : 'text-red-600'}`}>
                {positionCounts['Bowler'].main}/2
              </p>
              <p className="text-xs text-muted-foreground">
                Sub: {positionCounts['Bowler'].sub}/1
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">All-rounders</p>
              <p className={`text-lg font-bold ${positionCounts['All-rounder'].main === 2 ? 'text-green-600' : 'text-red-600'}`}>
                {positionCounts['All-rounder'].main}/2
              </p>
              <p className="text-xs text-muted-foreground">
                Sub: {positionCounts['All-rounder'].sub}/1
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Keeper</p>
              <p className={`text-lg font-bold ${positionCounts['Wicket-keeper'].main === 1 ? 'text-green-600' : 'text-red-600'}`}>
                {positionCounts['Wicket-keeper'].main}/1
              </p>
              <p className="text-xs text-muted-foreground">
                Sub: {positionCounts['Wicket-keeper'].sub}/1
              </p>
            </div>
          </div>
          {isFullTeamComplete ? (
            <Badge variant="default" className="w-full justify-center">Complete Team (11 Players)</Badge>
          ) : isMainTeamComplete ? (
            <Badge variant="secondary" className="w-full justify-center">Main Team Complete (Need Substitutes)</Badge>
          ) : (
            <Badge variant="destructive" className="w-full justify-center">Incomplete Team</Badge>
          )}
        </CardContent>
      </Card>

      {team.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No players in your team yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Go to the Players page to buy some players!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Team by Position */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold">Main Team (Playing XI)</h3>
            {Object.entries(playersByPosition).map(([position, players]) => (
              <Card key={position}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{position}{position === 'Wicket-keeper' ? '' : 's'}</span>
                    <Badge variant="secondary">
                      {players.main.length} / {position === 'Batsman' || position === 'Bowler' || position === 'All-rounder' ? '2' : '1'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {players.main.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {players.main.map((player) => (
                        <PlayerCard
                          key={player.player_id}
                          player={player}
                          onSetCaptain={handleSetCaptain}
                          onSellPlayer={handleSellPlayer}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No {position.toLowerCase()}{position === 'Wicket-keeper' ? '' : 's'} in your main team</p>
                      <p className="text-sm text-muted-foreground mt-1">Go to Players page to buy {position === 'Wicket-keeper' ? 'a wicket-keeper' : position.toLowerCase() + 's'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {/* Position-specific Substitutes */}
            <h3 className="text-xl font-semibold">Substitute Players</h3>
            {Object.entries(playersByPosition).map(([position, players]) => (
              <Card key={`sub-${position}`}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{position} Substitute</span>
                    <Badge variant="outline">{players.sub.length}/1</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {players.sub.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {players.sub.map((player) => (
                          <div key={player.player_id} className="relative">
                            <PlayerCard
                              player={player}
                              onSetCaptain={() => {}} // Subs can't be captains
                              onSellPlayer={handleSellPlayer}
                              showActions={false}
                            />
                            <Badge variant="outline" className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs">
                              Sub
                            </Badge>
                            <Button 
                              variant="destructive"
                              size="sm"
                              className="absolute top-0 right-0 w-6 h-6 p-0 text-xs"
                              onClick={() => handleSellPlayer(player.player_id)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Substitution Controls */}
                      {players.main.length > 0 && (
                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-3">Make Substitution</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Select a main team {position.toLowerCase()} to substitute:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {players.main.map((mainPlayer) => (
                                <Button
                                  key={mainPlayer.player_id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSubstitute(mainPlayer.player_id, players.sub[0].player_id)}
                                  className="text-xs"
                                >
                                  Swap with {mainPlayer.name}
                                  {mainPlayer.is_captain && ' (C)'}
                                </Button>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No {position.toLowerCase()} substitute</p>
                      <p className="text-sm text-muted-foreground mt-1">Go to Players page to buy a substitute {position.toLowerCase()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
