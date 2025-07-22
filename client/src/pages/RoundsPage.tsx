import * as React from 'react';
import { RoundsList } from '@/components/rounds/RoundsList';

export function RoundsPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Rounds</h2>
      <RoundsList />
    </div>
  );
}
