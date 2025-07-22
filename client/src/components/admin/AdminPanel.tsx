import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePlayer } from '@/components/admin/CreatePlayer';
import { ManagePlayers } from '@/components/admin/ManagePlayers';
import { CreateMatch } from '@/components/admin/CreateMatch';
import { ManageMatches } from '@/components/admin/ManageMatches';
import { AddStats } from '@/components/admin/AddStats';
import { ManageUsers } from '@/components/admin/ManageUsers';
import { H2HManagement } from '@/components/admin/H2HManagement';
import { CreateH2H } from '@/components/h2h/CreateH2H';

export function AdminPanel() {
  return (
    <Tabs defaultValue="create-player" className="w-full">
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="create-player">Create Player</TabsTrigger>
        <TabsTrigger value="manage-players">Manage Players</TabsTrigger>
        <TabsTrigger value="create-match">Create Match</TabsTrigger>
        <TabsTrigger value="manage-matches">Manage Matches</TabsTrigger>
        <TabsTrigger value="stats">Add Stats</TabsTrigger>
        <TabsTrigger value="users">Manage Users</TabsTrigger>
        <TabsTrigger value="h2h">H2H Matchups</TabsTrigger>
        <TabsTrigger value="create-h2h">Create H2H</TabsTrigger>
      </TabsList>
      
      <TabsContent value="create-player">
        <CreatePlayer />
      </TabsContent>
      
      <TabsContent value="manage-players">
        <ManagePlayers />
      </TabsContent>
      
      <TabsContent value="create-match">
        <CreateMatch />
      </TabsContent>
      
      <TabsContent value="manage-matches">
        <ManageMatches />
      </TabsContent>
      
      <TabsContent value="stats">
        <AddStats />
      </TabsContent>

      <TabsContent value="users">
        <ManageUsers />
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
