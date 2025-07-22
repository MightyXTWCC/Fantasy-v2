import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function ManagePlayers() {
  const { token } = useAuth();
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

  const handleDeletePlayer = async function(playerId: number, playerName: string) {
    if (!confirm(`Are you sure you want to delete ${playerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Player deleted successfully!');
        fetchPlayers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete player');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
    }
  };

  if (loading) {
    return <div>Loading players...</div>;
  }

  return (
    <div>
      <Toaster />
      <div className="mb-6">
        <Input
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <Card key={player.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{player.name}</span>
                <Badge variant="secondary">{player.position}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Price:</strong> ${player.current_price.toLocaleString()}</p>
                <p><strong>Total Points:</strong> {player.total_points}</p>
                <p><strong>Matches:</strong> {player.matches_played}</p>
                <Button 
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={() => handleDeletePlayer(player.id, player.name)}
                >
                  Delete Player
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
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
