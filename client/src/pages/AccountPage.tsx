import * as React from 'react';
import { AccountSettings } from '@/components/account/AccountSettings';

export function AccountPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Account Settings</h2>
      <AccountSettings />
    </div>
  );
}
