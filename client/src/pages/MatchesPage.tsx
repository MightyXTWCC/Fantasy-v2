import * as React from 'react';
import { MatchesList } from '@/components/matches/MatchesList';

export function MatchesPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Matches</h2>
      <MatchesList />
    </div>
  );
}
