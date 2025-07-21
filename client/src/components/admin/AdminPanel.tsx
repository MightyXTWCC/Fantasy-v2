import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePlayer } from '@/components/admin/CreatePlayer';
import { CreateMatch } from '@/components/admin/CreateMatch';
import { AddStats } from '@/components/admin/AddStats';

export function AdminPanel() {
  return (
    <Tabs defaultValue="players" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="players">Create Player</TabsTrigger>
        <TabsTrigger value="matches">Create Match</TabsTrigger>
        <TabsTrigger value="stats">Add Stats</TabsTrigger>
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
    </Tabs>
  );
}
