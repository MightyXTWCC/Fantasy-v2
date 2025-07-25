import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PositionIcon } from '@/components/ui/position-icon';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function PlayersList() {
  const { user, token } = useAuth();
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('name');

  const fetchPlayers = async function() {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (sortBy) {
        params.append('sortBy', sortBy);
      }
      
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/players?${params}`, { headers });
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
  }, [searchQuery, sortBy, token]);

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
        if (response.status === 423) {
          toast.error('Team changes are locked during active round', {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          toast.error(error.error, {
            duration: 4000,
            position: 'top-center',
          });
        }
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
    const currentPoints = player.current_round_points || 0;
    const totalPoints = player.total_points || 0;
    const isOwned = player.owned_by_user;

    return (
      <Card key={player.id} className={`hover:shadow-lg transition-shadow ${isOwned ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <PositionIcon position={player.position} className="w-5 h-5" />
              <span className="text-sm">{player.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{player.position}</Badge>
              {isOwned && <Badge variant="default" className="text-xs bg-green-600">OWNED</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Price:</strong> ${player.current_price.toLocaleString()}</p>
            <p><strong>Round Points:</strong> {currentPoints} <span className="text-muted-foreground">({totalPoints})</span></p>
            
            {!isOwned ? (
              <div className="space-y-2">
                <Button 
                  onClick={() => handleBuyPlayer(player.id, false)}
                  className="w-full"
                  size="sm"
                >
                  Buy for Main Team
                </Button>
                <Button 
                  onClick={() => handleBuyPlayer(player.id, true)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Buy as Substitute
                </Button>
              </div>
            ) : (
              <Badge variant="outline" className="w-full justify-center">
                In Your Team
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <Toaster />
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="price-low">Price (Low to High)</SelectItem>
            <SelectItem value="price-high">Price (High to Low)</SelectItem>
            <SelectItem value="points">Points (High to Low)</SelectItem>
          </SelectContent>
        </Select>
        
        {user && (
          <div className="flex items-center">
            <Badge variant="outline" className="text-sm">
              Budget: ${user.budget?.toLocaleString()}
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Players</TabsTrigger>
          <TabsTrigger value="wicket-keeper">Keepers</TabsTrigger>
          <TabsTrigger value="batsman">Batsmen</TabsTrigger>
          <TabsTrigger value="all-rounder">All-rounders</TabsTrigger>
          <TabsTrigger value="bowler">Bowlers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map(renderPlayerCard)}
          </div>
          {players.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No players found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="wicket-keeper">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playersByPosition['Wicket-keeper'].map(renderPlayerCard)}
          </div>
          {playersByPosition['Wicket-keeper'].length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No wicket-keepers found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="batsman">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playersByPosition['Batsman'].map(renderPlayerCard)}
          </div>
          {playersByPosition['Batsman'].length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No batsmen found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all-rounder">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playersByPosition['All-rounder'].map(renderPlayerCard)}
          </div>
          {playersByPosition['All-rounder'].length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No all-rounders found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="bowler">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playersByPosition['Bowler'].map(renderPlayerCard)}
          </div>
          {playersByPosition['Bowler'].length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No bowlers found
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
