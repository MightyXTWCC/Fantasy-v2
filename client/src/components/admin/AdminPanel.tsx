import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePlayer } from '@/components/admin/CreatePlayer';
import { ManagePlayers } from '@/components/admin/ManagePlayers';
import { CreateRound } from '@/components/admin/CreateRound';
import { ManageRounds } from '@/components/admin/ManageRounds';
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
        <TabsTrigger value="create-round">Create Round</TabsTrigger>
        <TabsTrigger value="manage-rounds">Manage Rounds</TabsTrigger>
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
      
      <TabsContent value="create-round">
        <CreateRound />
      </TabsContent>
      
      <TabsContent value="manage-rounds">
        <ManageRounds />
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
