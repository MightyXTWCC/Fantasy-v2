import * as React from 'react';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';

export function LeaderboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Leaderboard</h2>
      <Leaderboard />
    </div>
  );
}
