import * as React from 'react';
import { MyTeam } from '@/components/team/MyTeam';

export function MyTeamPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">My Team</h2>
      <MyTeam />
    </div>
  );
}
