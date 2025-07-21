import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { H2HMatchups } from '@/components/h2h/H2HMatchups';
import { CreateH2H } from '@/components/h2h/CreateH2H';

export function H2HPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Head-to-Head</h2>
      
      <Tabs defaultValue="matchups" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matchups">My Matchups</TabsTrigger>
          <TabsTrigger value="create">Create Matchup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="matchups">
          <H2HMatchups />
        </TabsContent>
        
        <TabsContent value="create">
          <CreateH2H />
        </TabsContent>
      </Tabs>
    </div>
  );
}
