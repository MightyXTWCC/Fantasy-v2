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
        <div className="relative bg-gradient-to-b from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 min-h-[600px] border-2 border-green-300 dark:border-green-700">
          
          {/* Wicket Keeper (Top) */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="text-center mb-2">
              <Badge variant="outline" className="mb-2">Wicket Keeper</Badge>
            </div>
            {keeper ? (
              <PlayerCard 
                player={keeper} 
                onSetCaptain={onSetCaptain}
                onSellPlayer={onSellPlayer}
              />
            ) : (
              <div className="w-32 h-40 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                No Keeper
              </div>
            )}
          </div>

          {/* Batsmen (Upper Middle) */}
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-full">
            <div className="text-center mb-2">
              <Badge variant="outline" className="mb-2">Batsmen</Badge>
            </div>
            <div className="flex justify-center space-x-8">
              {[0, 1].map(index => (
                <div key={index}>
                  {batsmen[index] ? (
                    <PlayerCard 
                      player={batsmen[index]} 
                      onSetCaptain={onSetCaptain}
                      onSellPlayer={onSellPlayer}
                    />
                  ) : (
                    <div className="w-32 h-40 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                      No Batsman
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* All-rounder (Center) */}
          <div className="absolute top-72 left-1/2 transform -translate-x-1/2">
            <div className="text-center mb-2">
              <Badge variant="outline" className="mb-2">All-rounder</Badge>
            </div>
            {allRounder ? (
              <PlayerCard 
                player={allRounder} 
                onSetCaptain={onSetCaptain}
                onSellPlayer={onSellPlayer}
              />
            ) : (
              <div className="w-32 h-40 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                No All-rounder
              </div>
            )}
          </div>

          {/* Bowlers (Bottom) */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full">
            <div className="text-center mb-2">
              <Badge variant="outline" className="mb-2">Bowlers</Badge>
            </div>
            <div className="flex justify-center space-x-8">
              {[0, 1].map(index => (
                <div key={index}>
                  {bowlers[index] ? (
                    <PlayerCard 
                      player={bowlers[index]} 
                      onSetCaptain={onSetCaptain}
                      onSellPlayer={onSellPlayer}
                    />
                  ) : (
                    <div className="w-32 h-40 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                      No Bowler
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cricket Stumps (Decorative) */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {[1,2,3].map(i => (
                <div key={i} className="w-1 h-6 bg-yellow-600 rounded-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
