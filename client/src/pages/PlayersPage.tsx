import * as React from 'react';
import { PlayersList } from '@/components/players/PlayersList';

export function PlayersPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Players Market</h2>
      <PlayersList />
    </div>
  );
}
