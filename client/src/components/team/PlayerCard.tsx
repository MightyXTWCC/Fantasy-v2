import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PositionIcon } from '@/components/ui/position-icon';

interface PlayerCardProps {
  player: any;
  onSetCaptain: (playerId: number) => void;
  onSellPlayer: (playerId: number) => void;
  showActions?: boolean;
}

export function PlayerCard({ player, onSetCaptain, onSellPlayer, showActions = true }: PlayerCardProps) {
  const currentPoints = player.current_round_points || 0;
  const totalPoints = player.total_points || 0;

  return (
    <Card className="w-28 h-36 relative">
      <CardContent className="p-1 h-full flex flex-col">
        {/* Captain Badge */}
        {player.is_captain && (
          <Badge variant="default" className="absolute -top-2 -right-2 text-xs z-10">C</Badge>
        )}
        
        {/* Position Icon */}
        <div className="flex justify-center mb-1">
          <PositionIcon position={player.position} className="w-4 h-4" />
        </div>
        
        {/* Player Name */}
        <div className="text-center mb-1">
          <p className="text-xs font-medium truncate" title={player.name}>
            {player.name}
          </p>
        </div>
        
        {/* Points */}
        <div className="text-center mb-2">
          <p className="text-xs text-muted-foreground">
            {currentPoints}
            {player.is_captain && ' (x2)'}
          </p>
          <p className="text-xs text-muted-foreground opacity-75">
            ({totalPoints})
          </p>
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="mt-auto space-y-1">
            <Button 
              variant="outline"
              size="sm"
              className="w-full text-xs h-5"
              onClick={() => onSetCaptain(player.player_id)}
              disabled={player.is_captain}
            >
              {player.is_captain ? 'Captain' : 'Captain'}
            </Button>
            <Button 
              variant="destructive"
              size="sm"
              className="w-full text-xs h-5"
              onClick={() => onSellPlayer(player.player_id)}
            >
              Sell
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
