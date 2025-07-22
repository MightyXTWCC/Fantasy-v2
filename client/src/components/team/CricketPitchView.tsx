import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerCard } from '@/components/team/PlayerCard';

interface CricketPitchViewProps {
  team: any[];
  onSetCaptain: (playerId: number) => void;
  onSellPlayer: (playerId: number) => void;
}

export function CricketPitchView({ team, onSetCaptain, onSellPlayer }: CricketPitchViewProps) {
  // Organize players by position
  const keeper = team.find(p => p.position === 'Wicket-keeper');
  const batsmen = team.filter(p => p.position === 'Batsman');
  const allRounder = team.find(p => p.position === 'All-rounder');
  const bowlers = team.filter(p => p.position === 'Bowler');

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Cricket Pitch Formation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gradient-to-b from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-8 min-h-[800px] border-2 border-green-300 dark:border-green-700">
          
          {/* Top Stumps */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {[1,2,3].map(i => (
                <div key={i} className="w-1 h-8 bg-yellow-600 rounded-sm"></div>
              ))}
            </div>
            {/* Bails */}
            <div className="w-6 h-1 bg-yellow-600 rounded-sm -mt-1"></div>
          </div>

          {/* Wicket Keeper (Behind top stumps) */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
            <div className="text-center mb-4">
              <Badge variant="outline" className="mb-3">Wicket Keeper</Badge>
            </div>
            {keeper ? (
              <PlayerCard 
                player={keeper} 
                onSetCaptain={onSetCaptain}
                onSellPlayer={onSellPlayer}
              />
            ) : (
              <div className="w-28 h-36 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-xs text-muted-foreground text-center p-2">
                No Keeper
              </div>
            )}
          </div>

          {/* Cricket Pitch (Brown Rectangle) */}
          <div className="absolute top-48 left-1/2 transform -translate-x-1/2 w-20 h-96 bg-amber-800 border-2 border-amber-900 rounded-sm opacity-60"></div>

          {/* Batsmen (Upper Middle) */}
          <div className="absolute top-64 left-1/2 transform -translate-x-1/2 w-full">
            <div className="text-center mb-4">
              <Badge variant="outline" className="mb-3">Batsmen</Badge>
            </div>
            <div className="flex justify-center space-x-16">
              {[0, 1].map(index => (
                <div key={index}>
                  {batsmen[index] ? (
                    <PlayerCard 
                      player={batsmen[index]} 
                      onSetCaptain={onSetCaptain}
                      onSellPlayer={onSellPlayer}
                    />
                  ) : (
                    <div className="w-28 h-36 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-xs text-muted-foreground text-center p-2">
                      No Batsman
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* All-rounder (Center) */}
          <div className="absolute top-80 left-1/2 transform -translate-x-1/2">
            <div className="text-center mb-4">
              <Badge variant="outline" className="mb-3">All-rounder</Badge>
            </div>
            {allRounder ? (
              <PlayerCard 
                player={allRounder} 
                onSetCaptain={onSetCaptain}
                onSellPlayer={onSellPlayer}
              />
            ) : (
              <div className="w-28 h-36 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-xs text-muted-foreground text-center p-2">
                No All-rounder
              </div>
            )}
          </div>

          {/* Bowlers (Lower area) */}
          <div className="absolute top-96 left-1/2 transform -translate-x-1/2 w-full mt-16">
            <div className="text-center mb-4">
              <Badge variant="outline" className="mb-3">Bowlers</Badge>
            </div>
            <div className="flex justify-center space-x-16">
              {[0, 1].map(index => (
                <div key={index}>
                  {bowlers[index] ? (
                    <PlayerCard 
                      player={bowlers[index]} 
                      onSetCaptain={onSetCaptain}
                      onSellPlayer={onSellPlayer}
                    />
                  ) : (
                    <div className="w-28 h-36 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-xs text-muted-foreground text-center p-2">
                      No Bowler
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stumps */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {[1,2,3].map(i => (
                <div key={i} className="w-1 h-8 bg-yellow-600 rounded-sm"></div>
              ))}
            </div>
            {/* Bails */}
            <div className="w-6 h-1 bg-yellow-600 rounded-sm -mt-1"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
