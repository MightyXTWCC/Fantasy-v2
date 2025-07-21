import * as React from 'react';
import { H2HMatchups } from '@/components/h2h/H2HMatchups';
import { useAuth } from '@/hooks/useAuth';

export function H2HPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Head-to-Head</h2>
      
      {!user?.is_admin && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Head-to-head matchups are created by administrators. Check back here to see your matchups!
          </p>
        </div>
      )}
      
      <H2HMatchups />
    </div>
  );
}
