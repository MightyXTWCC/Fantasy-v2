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
  const [editScores, setEditScores] = React.useState({
    total_points: 0,
    current_round_points: 0
  });

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
    if (!confirm(`Are you sure you want to delete ${playerName}? This will remove them from all user teams. This action cannot be undone.`)) {
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

  const handleDeleteAllPlayers = async function() {
    if (!confirm('Are you sure you want to delete ALL players? This will remove all players from all teams and reset the entire player database. This action cannot be undone.')) {
      return;
    }
    
    if (!confirm('This is your final warning. ALL PLAYERS WILL BE DELETED. Type "DELETE ALL" in the next prompt to confirm.')) {
      return;
    }
    
    const confirmation = prompt('Type "DELETE ALL" to confirm:');
    if (confirmation !== 'DELETE ALL') {
      toast.error('Deletion cancelled - confirmation text did not match');
      return;
    }

    try {
      const response = await fetch('/api/admin/players/all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('All players deleted successfully!');
        fetchPlayers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete all players');
      }
    } catch (error) {
      console.error('Error deleting all players:', error);
      toast.error('Failed to delete all players');
    }
  };

  const handleRunMarketManagement = async function() {
    try {
      const response = await fetch('/api/admin/market-management', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Market prices updated successfully!');
        fetchPlayers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update market prices');
      }
    } catch (error) {
      console.error('Error running market management:', error);
      toast.error('Failed to update market prices');
    }
  };

  const handleEditPrice = function(player) {
    setEditingPlayer(player);
    setEditPrice(player.current_price.toString());
  };

  const handleEditScores = function(player) {
    setEditingPlayer(player);
    setEditScores({
      total_points: player.total_points,
      current_round_points: player.current_round_points
    });
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

  const handleUpdateScores = async function() {
    if (!editingPlayer) return;

    try {
      const response = await fetch(`/api/admin/players/${editingPlayer.id}/scores`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editScores)
      });

      if (response.ok) {
        toast.success('Player scores updated successfully!');
        setEditingPlayer(null);
        setEditScores({ total_points: 0, current_round_points: 0 });
        fetchPlayers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update scores');
      }
    } catch (error) {
      console.error('Error updating scores:', error);
      toast.error('Failed to update scores');
    }
  };

  if (loading) {
    return <div>Loading players...</div>;
  }

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
        
        <div className="flex gap-2">
          <Button 
            onClick={handleRunMarketManagement}
            variant="outline"
          >
            Update Market Prices
          </Button>
          
          <Button 
            onClick={handleDeleteAllPlayers}
            variant="destructive"
          >
            Delete All Players
          </Button>
        </div>
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
                
                <div className="flex flex-col space-y-2 mt-4">
                  <div className="flex space-x-2">
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

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditScores(player)}>
                          Edit Scores
                        </Button>
                      