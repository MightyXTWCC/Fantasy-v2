import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerCard } from '@/components/team/PlayerCard';

interface SubstituteBenchProps {
  substitutes: any[];
  mainTeam: any[];
  onSubstitute: (mainPlayerId: number, substitutePlayerId: number) => void;
  onSellPlayer: (playerId: number) => void;
}

export function SubstituteBench({ substitutes, mainTeam, onSubstitute, onSellPlayer }: SubstituteBenchProps) {
  const [selectedSub, setSelectedSub] = React.useState<number | null>(null);
  const [selectedMain, setSelectedMain] = React.useState<number | null>(null);

  const handleSubstitute = function() {
    if (selectedMain && selectedSub) {
      onSubstitute(selectedMain, selectedSub);
      setSelectedMain(null);
      setSelectedSub(null);
    }
  };

  // Get available main players for substitution based on selected substitute
  const getAvailableMainPlayers = function() {
    if (!selectedSub) return [];
    const sub = substitutes.find(p => p.player_id === selectedSub);
    if (!sub) return [];
    return mainTeam.filter(p => p.position === sub.position);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Substitute Players</span>
          <Badge variant="secondary">{substitutes.length} Subs</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {substitutes.map((player) => (
            <div 
              key={player.player_id} 
              className={`relative cursor-pointer ${selectedSub === player.player_id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedSub(selectedSub === player.player_id ? null : player.player_id)}
            >
              <PlayerCard 
                player={player} 
                onSetCaptain={() => {}} // Subs can't be captains
                onSellPlayer={onSellPlayer}
                showActions={false}
              />
              <Badge variant="outline" className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs">
                Sub
              </Badge>
              <Button 
                variant="destructive"
                size="sm"
                className="absolute top-0 right-0 w-6 h-6 p-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSellPlayer(player.player_id);
                }}
              >
                ×
              </Button>
            </div>
          ))}
        </div>

        {/* Substitution Controls */}
        {selectedSub && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Make Substitution</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Select a main team player to substitute:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {getAvailableMainPlayers().map((player) => (
                  <Button
                    key={player.player_id}
                    variant={selectedMain === player.player_id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMain(selectedMain === player.player_id ? null : player.player_id)}
                    className="text-xs"
                  >
                    {player.name}
                    {player.is_captain && ' (C)'}
                  </Button>
                ))}
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSubstitute}
                  disabled={!selectedMain || !selectedSub}
                  size="sm"
                >
                  Make Substitution
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedSub(null);
                    setSelectedMain(null);
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
