import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function ManagePlayers() {
  const { token } = useAuth();
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingPlayer, setEditingPlayer] = React.useState(null);
  const [editPrice, setEditPrice] = React.useState('');

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

  const handleEditPrice = function(player) {
    setEditingPlayer(player);
    setEditPrice(player.current_price.toString());
  };

  const handleUpdatePrice = async function() {
    if (!editingPlayer) return;

    try {
      const response = await fetch(`/api/players/${editingPlayer.id}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_price: parseFloat(editPrice) })
      });

      if (response.ok) {
        toast.success('Player price updated successfully!');
        setEditingPlayer(null);
        setEditPrice('');
        fetchPlayers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
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
                <div className="flex justify-between items-center">
                  <span>Price:</span>
                  <span className="font-bold">${player.current_price.toLocaleString()}</span>
                </div>
                <p><strong>Total Points:</strong> {player.total_points}</p>
                <p><strong>Current Round:</strong> {player.current_round_points}</p>
                
                <div className="flex space-x-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEditPrice(player)}>
                        Edit Price
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Price: {editingPlayer?.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-price">Current Price</Label>
                          <Input
                            id="edit-price"
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            placeholder="Enter new price"
                          />
                        </div>
                        
                        <Button onClick={handleUpdatePrice} className="w-full">
                          Update Price
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePlayer(player.id, player.name)}
                  >
                    Delete
                  </Button>
                </div>
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
