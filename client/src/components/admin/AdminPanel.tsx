import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePlayer } from '@/components/admin/CreatePlayer';
import { CreateMatch } from '@/components/admin/CreateMatch';
import { AddStats } from '@/components/admin/AddStats';
import { UserManagement } from '@/components/admin/UserManagement';
import { H2HManagement } from '@/components/admin/H2HManagement';
import { CreateH2H } from '@/components/h2h/CreateH2H';

export function AdminPanel() {
  return (
    <Tabs defaultValue="players" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="players">Create Player</TabsTrigger>
        <TabsTrigger value="matches">Create Match</TabsTrigger>
        <TabsTrigger value="stats">Add Stats</TabsTrigger>
        <TabsTrigger value="users">Users & Teams</TabsTrigger>
        <TabsTrigger value="h2h">H2H Matchups</TabsTrigger>
        <TabsTrigger value="create-h2h">Create H2H</TabsTrigger>
      </TabsList>
      
      <TabsContent value="players">
        <CreatePlayer />
      </TabsContent>
      
      <TabsContent value="matches">
        <CreateMatch />
      </TabsContent>
      
      <TabsContent value="stats">
        <AddStats />
      </TabsContent>

      <TabsContent value="users">
        <UserManagement />
      </TabsContent>

      <TabsContent value="h2h">
        <H2HManagement />
      </TabsContent>

      <TabsContent value="create-h2h">
        <CreateH2H />
      </TabsContent>
    </Tabs>
  );
}
