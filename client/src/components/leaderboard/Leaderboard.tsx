import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';

export function Leaderboard() {
  const { leaderboard, loading } = useLeaderboardData();

  if (loading) {
    return <div>Loading leaderboard...</div>;
  }

  return (
    <div className="space-y-4">
      {leaderboard.map((team, index) => (
        <Card key={team.user_id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Badge variant={index === 0 ? 'default' : 'secondary'}>
                  #{index + 1}
                </Badge>
                <span>{team.username}</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{team.total_points} pts</p>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
      
      {leaderboard.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No teams found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
