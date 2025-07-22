import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoundsData } from '@/hooks/useRoundsData';

export function RoundsList() {
  const { rounds, loading } = useRoundsData();

  if (loading) {
    return <div>Loading rounds...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rounds.map((round) => {
        const lockoutTime = new Date(round.lockout_time);
        const now = new Date();
        const isLocked = now >= lockoutTime || round.is_locked;
        const isActive = round.is_active;

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
              <div className="space-y-2">
                <p><strong>Round:</strong> {round.round_number}</p>
                <p><strong>Lockout:</strong> {lockoutTime.toLocaleString('en-AU', {
                  timeZone: 'Australia/Sydney',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}</p>
                {isActive && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      This is the currently active round
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {rounds.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No rounds scheduled yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
