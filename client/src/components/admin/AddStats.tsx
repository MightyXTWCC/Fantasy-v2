import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayersData } from '@/hooks/usePlayersData';
import { useMatchesData } from '@/hooks/useMatchesData';
import { useAuth } from '@/hooks/useAuth';

export function AddStats() {
  const { players } = usePlayersData();
  const { matches } = useMatchesData();
  const { token } = useAuth();
  
  const [formData, setFormData] = React.useState({
    player_id: '',
    match_id: '',
    runs: 0,
    balls_faced: 0,
    fours: 0,
    sixes: 0,
    wickets: 0,
    overs_bowled: 0,
    runs_conceded: 0,
    catches: 0,
    stumpings: 0,
    run_outs: 0
  });

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token) return;
    
    try {
      const response = await fetch('/api/player-stats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          player_id: parseInt(formData.player_id),
          match_id: parseInt(formData.match_id)
        })
      });
      
      if (response.ok) {
        setFormData({
          player_id: '',
          match_id: '',
          runs: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
          wickets: 0,
          overs_bowled: 0,
          runs_conceded: 0,
          catches: 0,
          stumpings: 0,
          run_outs: 0
        });
        alert('Player stats added successfully!');
      }
    } catch (error) {
      console.error('Error adding stats:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Player Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Player</Label>
              <Select value={formData.player_id} onValueChange={(value) => setFormData({ ...formData, player_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.name} ({player.team})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Match</Label>
              <Select value={formData.match_id} onValueChange={(value) => setFormData({ ...formData, match_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select match" />
                </SelectTrigger>
                <SelectContent>
                  {matches.map((match) => (
                    <SelectItem key={match.id} value={match.id.toString()}>
                      {match.match_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="runs">Runs</Label>
              <Input
                id="runs"
                type="number"
                value={formData.runs}
                onChange={(e) => setFormData({ ...formData, runs: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="balls_faced">Balls Faced</Label>
              <Input
                id="balls_faced"
                type="number"
                value={formData.balls_faced}
                onChange={(e) => setFormData({ ...formData, balls_faced: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fours">Fours</Label>
              <Input
                id="fours"
                type="number"
                value={formData.fours}
                onChange={(e) => setFormData({ ...formData, fours: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="sixes">Sixes</Label>
              <Input
                id="sixes"
                type="number"
                value={formData.sixes}
                onChange={(e) => setFormData({ ...formData, sixes: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="wickets">Wickets</Label>
              <Input
                id="wickets"
                type="number"
                value={formData.wickets}
                onChange={(e) => setFormData({ ...formData, wickets: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="overs_bowled">Overs Bowled</Label>
              <Input
                id="overs_bowled"
                type="number"
                step="0.1"
                value={formData.overs_bowled}
                onChange={(e) => setFormData({ ...formData, overs_bowled: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="runs_conceded">Runs Conceded</Label>
              <Input
                id="runs_conceded"
                type="number"
                value={formData.runs_conceded}
                onChange={(e) => setFormData({ ...formData, runs_conceded: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="catches">Catches</Label>
              <Input
                id="catches"
                type="number"
                value={formData.catches}
                onChange={(e) => setFormData({ ...formData, catches: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="stumpings">Stumpings</Label>
              <Input
                id="stumpings"
                type="number"
                value={formData.stumpings}
                onChange={(e) => setFormData({ ...formData, stumpings: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="run_outs">Run Outs</Label>
              <Input
                id="run_outs"
                type="number"
                value={formData.run_outs}
                onChange={(e) => setFormData({ ...formData, run_outs: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full">Add Stats</Button>
        </form>
      </CardContent>
    </Card>
  );
}
