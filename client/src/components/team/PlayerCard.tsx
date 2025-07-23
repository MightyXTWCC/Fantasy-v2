import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PositionIcon } from "@/components/ui/position-icon";

interface PlayerCardProps {
  player: any;
  onSetCaptain: (playerId: number) => void;
  onSellPlayer: (playerId: number) => void;
  showActions?: boolean;
}

export function PlayerCard({
  player,
  onSetCaptain,
  onSellPlayer,
  showActions = true,
}: PlayerCardProps) {
  const currentPoints = player.current_round_points || 0;
  const totalPoints = player.total_points || 0;

  return (
    <Card className="w-full h-auto relative">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Captain Badge */}
        {player.is_captain && (
          <Badge
            variant="default"
            className="absolute -top-2 -right-2 text-xs z-10"
          >
            C
          </Badge>
        )}

        {/* Position Icon */}
        <div className="flex justify-center mb-2">
          <PositionIcon position={player.position} className="w-6 h-6" />
        </div>

        {/* Player Name */}
        <div className="text-center mb-2">
          <p className="text-sm font-medium" title={player.name}>
            {player.name}
          </p>
        </div>

        {/* Points - only show if player has points */}
        {(currentPoints > 0 || totalPoints > 0) && (
          <div className="text-center mb-3">
            {currentPoints > 0 && (
              <p className="text-sm text-muted-foreground">
                Round: {currentPoints}{player.is_captain && " (x2)"}
              </p>
            )}
            {totalPoints > 0 && (
              <p className="text-xs text-muted-foreground opacity-75">
                Total: {totalPoints}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-auto space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => onSetCaptain(player.player_id)}
              disabled={player.is_captain}
            >
              {player.is_captain ? "Captain" : "Set Captain"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full text-xs"
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
