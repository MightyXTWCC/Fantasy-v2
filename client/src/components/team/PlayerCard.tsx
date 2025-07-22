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
  return (
    <Card className="w-32 h-40 relative">
      <CardContent className="p-2 h-full flex flex-col">
        {/* Captain Badge */}
        {player.is_captain && (
          <Badge variant="default" className="absolute -top-2 -right-2 text-xs z-10">C</Badge>
        )}
        
        {/* Position Icon */}
        <div className="flex justify-center mb-1">
          <PositionIcon position={player.position} className="w-6 h-6" />
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
            {player.total_points} pts
            {player.is_captain && ' (x2)'}
          </p>
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="mt-auto space-y-1">
            <Button 
              variant="outline"
              size="sm"
              className="w-full text-xs h-6"
              onClick={() => onSetCaptain(player.player_id)}
              disabled={player.is_captain}
            >
              {player.is_captain ? 'Captain' : 'Captain'}
            </Button>
            <Button 
              variant="destructive"
              size="sm"
              className="w-full text-xs h-6"
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
