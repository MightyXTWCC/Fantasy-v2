import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoundsData } from '@/hooks/useRoundsData';
import { useTeamData } from '@/hooks/useTeamData';

export function RoundsList() {
  const { rounds, loading } = useRoundsData();
  const { team } = useTeamData();

  const calculateTeamScoreForRound = function(roundId: number) {
    const mainTeam = team.filter(player => !player.is_substitute);
    // For now, we'll use current round points as placeholder
    // In a full implementation, you'd need to fetch historical stats for this round
    return mainTeam.reduce((total, player) => {
      let points = player.current_round_points || 0;
      if (player.is_captain) {
        points *= 2;
      }
      return total + points;
    }, 0);
  };

  if (loading) {
    return <div>Loading rounds...</div>;
  }

  return (
    <div className="space-y-4">
      {rounds.map((round) => {
        const lockoutTime = new Date(round.lockout_time);
        const now = new Date();
        const isLocked = now >= lockoutTime || round.is_locked;
        const isActive = round.is_active;
        const teamScore = calculateTeamScoreForRound(round.id);

        return (
          <Card key={round.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{round.name}</span>
                <div className="space-x-2">
                  {isActive && <Badge variant="default">Active</Badge>}
                  <Badge variant={isLocked ? 'destructive' : 'secondary'}>
                    {isLocked ? 'Locked' : 'Open'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p><strong>Round:</strong> {round.round_number}</p>
                  <p><strong>Lockout:</strong> {lockoutTime.toLocaleString('en-AU', {
                    timeZone: 'Australia/Sydney',
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}</p>
                  <p><strong>Created:</strong> {new Date(round.created_at).toLocaleDateString()}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Your Team Score</p>
                  <p className="text-2xl font-bold text-primary">
                    {isActive ? teamScore : '--'}
                  </p>
                  {!isActive && (
                    <p className="text-xs text-muted-foreground">
                      {now < lockoutTime ? 'Not started' : 'Round complete'}
                    </p>
                  )}
                </div>

                <div>
                  {isActive && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold">
                        Current Active Round
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                        Team changes {isLocked ? 'locked' : 'allowed'}
                      </p>
                    </div>
                  )}
                  
                  {!isActive && now > lockoutTime && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Round Completed
                      </p>
                    </div>
                  )}
                  
                  {!isActive && now < lockoutTime && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Upcoming Round
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {rounds.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No rounds scheduled yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
