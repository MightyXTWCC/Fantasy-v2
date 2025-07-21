import * as React from 'react';
import { AdminPanel } from '@/components/admin/AdminPanel';

export function AdminPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Admin Panel</h2>
      <AdminPanel />
    </div>
  );
}
