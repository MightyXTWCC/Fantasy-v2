import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RoundStatus() {
  const [currentRound, setCurrentRound] = React.useState(null);
  const [timeUntilLockout, setTimeUntilLockout] = React.useState(0);

  React.useEffect(() => {
    const fetchCurrentRound = async function() {
      try {
        const response = await fetch('/api/current-round');
        if (response.ok) {
          const data = await response.json();
          setCurrentRound(data);
          if (data && data.time_until_lockout) {
            setTimeUntilLockout(data.time_until_lockout);
          }
        }
      } catch (error) {
        console.error('Error fetching current round:', error);
      }
    };

    fetchCurrentRound();
    const interval = setInterval(fetchCurrentRound, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (timeUntilLockout > 0) {
      const timer = setInterval(() => {
        setTimeUntilLockout(prev => Math.max(0, prev - 1000));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeUntilLockout]);

  const formatTimeRemaining = function(milliseconds: number) {
    if (milliseconds <= 0) return 'LOCKED';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (!currentRound) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="text-center">
            <Badge variant="outline">No Active Round</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLocked = timeUntilLockout <= 0 || currentRound.is_locked;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{currentRound.name}</span>
          <Badge variant={isLocked ? 'destructive' : 'default'}>
            {isLocked ? 'LOCKED' : 'OPEN'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Round</p>
            <p className="text-lg font-bold">{currentRound.round_number}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Lockout Time</p>
            <p className="text-lg font-bold">
              {new Date(currentRound.lockout_time).toLocaleString('en-AU', {
                timeZone: 'Australia/Sydney',
                dateStyle: 'short',
                timeStyle: 'short'
              })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Time Remaining</p>
            <p className={`text-lg font-bold ${isLocked ? 'text-red-600' : 'text-green-600'}`}>
              {formatTimeRemaining(timeUntilLockout)}
            </p>
          </div>
        </div>
        {isLocked && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400 text-center">
              Team changes are locked during active round. You cannot buy, sell, substitute players, or change captain.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
