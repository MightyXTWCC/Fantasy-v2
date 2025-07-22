import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTeamData } from '@/hooks/useTeamData';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { CricketPitchView } from '@/components/team/CricketPitchView';
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

  // Check team composition requirements
  const positionCounts = {
    'Batsman': 0,
    'Bowler': 0,
    'All-rounder': 0,
    'Wicket-keeper': 0
  };

  mainTeam.forEach(player => {
    positionCounts[player.position]++;
  });

  const isTeamComplete = positionCounts['Batsman'] === 2 && 
                        positionCounts['Bowler'] === 2 && 
                        positionCounts['All-rounder'] === 1 && 
                        positionCounts['Wicket-keeper'] === 1;

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
              <p className="text-2xl font-bold">{team.length}/6</p>
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

      {/* Team Composition Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Batsmen</p>
              <p className={`text-lg font-bold ${positionCounts['Batsman'] === 2 ? 'text-green-600' : 'text-red-600'}`}>
                {positionCounts['Batsman']}/2
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Bowlers</p>
              <p className={`text-lg font-bold ${positionCounts['Bowler'] === 2 ? 'text-green-600' : 'text-red-600'}`}>
                {positionCounts['Bowler']}/2
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">All-rounder</p>
              <p className={`text-lg font-bold ${positionCounts['All-rounder'] === 1 ? 'text-green-600' : 'text-red-600'}`}>
                {positionCounts['All-rounder']}/1
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Keeper</p>
              <p className={`text-lg font-bold ${positionCounts['Wicket-keeper'] === 1 ? 'text-green-600' : 'text-red-600'}`}>
                {positionCounts['Wicket-keeper']}/1
              </p>
            </div>
          </div>
          {isTeamComplete ? (
            <Badge variant="default" className="w-full justify-center">Team Complete</Badge>
          ) : (
            <Badge variant="destructive" className="w-full justify-center">Incomplete Team</Badge>
          )}
        </CardContent>
      </Card>

      {mainTeam.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No players in your team yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Go to the Players page to buy some players!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cricket Pitch Visualization */}
          <CricketPitchView 
            team={mainTeam} 
            onSetCaptain={handleSetCaptain}
            onSellPlayer={handleSellPlayer}
          />
          
          {/* Substitutes Bench */}
          {substitutes.length > 0 && (
            <SubstituteBench 
              substitutes={substitutes}
              mainTeam={mainTeam}
              onSubstitute={handleSubstitute}
              onSellPlayer={handleSellPlayer}
            />
          )}
        </>
      )}
    </div>
  );
}
