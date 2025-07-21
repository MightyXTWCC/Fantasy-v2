import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useH2HData } from '@/hooks/useH2HData';

export function H2HMatchups() {
  const { matchups, loading } = useH2HData();

  if (loading) {
    return <div>Loading matchups...</div>;
  }

  return (
    <div className="space-y-4">
      {matchups.map((matchup) => (
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
      ))}
      
      {matchups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No head-to-head matchups found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
