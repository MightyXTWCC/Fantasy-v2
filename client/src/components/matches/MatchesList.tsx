import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMatchesData } from '@/hooks/useMatchesData';

export function MatchesList() {
  const { matches, loading } = useMatchesData();

  if (loading) {
    return <div>Loading matches...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((match) => (
        <Card key={match.id}>
          <CardHeader>
            <CardTitle>{match.match_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Date:</strong> {new Date(match.date).toLocaleDateString()}</p>
              <p><strong>Teams:</strong> {match.team1} vs {match.team2}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
