import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PositionIcon } from '@/components/ui/position-icon';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function PlayersList() {
  const { user, token } = useAuth();
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchPlayers = async function() {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const response = await fetch(`/api/players?${params}`);
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPlayers();
  }, [searchQuery]);

  const handleBuyPlayer = async function(playerId: number, isSubstitute = false) {
    if (!token) return;

    try {
      const response = await fetch('/api/buy-player', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ playerId, isSubstitute })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message, {
          duration: 4000,
          position: 'top-center',
        });
        fetchPlayers();
        window.location.reload(); // Refresh to update budget
      } else {
        const error = await response.json();
        toast.error(error.error, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error buying player:', error);
      toast.error('Failed to buy player', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  if (loading) {
    return <div>Loading players...</div>;
  }

  // Group players by position for better organization
  const playersByPosition = {
    'Wicket-keeper': players.filter(p => p.position === 'Wicket-keeper'),
    'Batsman': players.filter(p => p.position === 'Batsman'),
    'All-rounder': players.filter(p => p.position === 'All-rounder'),
    'Bowler': players.filter(p => p.position === 'Bowler')
  };

  const renderPlayerCard = function(player) {
    return (
      <Card key={player.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <PositionIcon position={player.position} className="w-5 h-5" />
              <span className="text-sm">{player.name}</span>
            </div>
            <Badge variant="secondary">{player.position}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Price:</strong> ${player.current_price.toLocaleString()}</p>
            <p><strong>Total Points:</strong> {player.total_points}</p>
            <p><strong>Matches:</strong> {player.matches_played}</p>
            <div className="space-y-2 mt-4">
              <Button 
                className="w-full"
                onClick={() => handleBuyPlayer(player.id, false)}
                disabled={!user || user.budget < player.current_price}
              >
                Buy as Main Player
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleBuyPlayer(player.id, true)}
                disabled={!user || user.budget < player.current_price}
              >
                Buy as Substitute
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <Toaster />
      <div className="mb-6 space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-lg font-semibold">
            Budget: ${user?.budget?.toLocaleString() || 0}
          </p>
        </div>
        
        <div>
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Team Requirements Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Team Requirements:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>2 Batsmen</div>
              <div>2 Bowlers</div>
              <div>1 All-rounder</div>
              <div>1 Wicket-keeper</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Plus 1 substitute for each position type (total 6 players)
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Players</TabsTrigger>
          <TabsTrigger value="Wicket-keeper">Keepers</TabsTrigger>
          <TabsTrigger value="Batsman">Batsmen</TabsTrigger>
          <TabsTrigger value="All-rounder">All-rounders</TabsTrigger>
          <TabsTrigger value="Bowler">Bowlers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map(renderPlayerCard)}
          </div>
        </TabsContent>
        
        {Object.entries(playersByPosition).map(([position, positionPlayers]) => (
          <TabsContent key={position} value={position}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positionPlayers.map(renderPlayerCard)}
            </div>
            {positionPlayers.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No {position.toLowerCase()}s found matching your search.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {players.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No players found matching your search.' : 'No players available.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
