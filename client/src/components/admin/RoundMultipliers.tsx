import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRoundsData } from '@/hooks/useRoundsData';
import toast, { Toaster } from 'react-hot-toast';

export function RoundMultipliers() {
  const { token } = useAuth();
  const { rounds } = useRoundsData();
  const [selectedRound, setSelectedRound] = React.useState('');
  const [multipliers, setMultipliers] = React.useState([]);
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    player_id: '',
    multiplier: 1.0
  });

  React.useEffect(() => {
    const fetchPlayers = async function() {
      try {
        const response = await fetch('/api/players');
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
  }, []);

  React.useEffect(() => {
    if (selectedRound) {
      fetchMultipliers();
    }
  }, [selectedRound]);

  const fetchMultipliers = async function() {
    if (!selectedRound || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rounds/${selectedRound}/multipliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMultipliers(data);
    } catch (error) {
      console.error('Error fetching multipliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token || !selectedRound) return;
    
    try {
      const response = await fetch(`/api/rounds/${selectedRound}/multipliers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          player_id: parseInt(formData.player_id),
          multiplier: parseFloat(formData.multiplier.toString())
        })
      });
      
      if (response.ok) {
        setFormData({ player_id: '', multiplier: 1.0 });
        toast.success('Player multiplier set successfully!');
        fetchMultipliers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to set multiplier');
      }
    } catch (error) {
      console.error('Error setting multiplier:', error);
      toast.error('Failed to set multiplier');
    }
  };

  const handleDeleteMultiplier = async function(playerId: number, playerName: string) {
    if (!confirm(`Remove multiplier for ${playerName}?`)) return;

    try {
      const response = await fetch(`/api/rounds/${selectedRound}/multipliers/${playerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Multiplier removed successfully!');
        fetchMultipliers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove multiplier');
      }
    } catch (error) {
      console.error('Error removing multiplier:', error);
      toast.error('Failed to remove multiplier');
    }
  };

  const selectedRoundName = rounds.find(r => r.id.toString() === selectedRound)?.name;
  const availablePlayers = players.filter(p => 
    !multipliers.some(m => m.player_id === p.id)
  );

  return (
    <div>
      <Toaster />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Round Multipliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Round</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a round to manage multipliers" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id.toString()}>
                      {round.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRound && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Set score multipliers for individual players in <strong>{selectedRoundName}</strong>. 
                  Multipliers are applied to the final calculated points.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedRound && (
        <>
          {/* Add New Multiplier */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Player Multiplier</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Player</Label>
                    <Select 
                      value={formData.player_id} 
                      onValueChange={(value) => setFormData({ ...formData, player_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayers.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.name} ({player.position})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="multiplier">Multiplier</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={formData.multiplier}
                      onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1.0 })}
                      placeholder="e.g., 1.5, 2.0"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={!formData.player_id}>
                  Set Multiplier
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Multipliers */}
          <Card>
            <CardHeader>
              <CardTitle>Current Multipliers for {selectedRoundName}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading multipliers...</p>
              ) : multipliers.length > 0 ? (
                <div className="space-y-3">
                  {multipliers.map((multiplier) => (
                    <div key={multiplier.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{multiplier.player_name}</p>
                        <p className="text-sm text-muted-foreground">{multiplier.player_position}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="text-base">
                          {multiplier.multiplier}x
                        </Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMultiplier(multiplier.player_id, multiplier.player_name)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No multipliers set for this round yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
