import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMatchesData } from '@/hooks/useMatchesData';
import { useAuth } from '@/hooks/useAuth';

export function CreateH2H() {
  const { matches } = useMatchesData();
  const { token } = useAuth();
  
  const [formData, setFormData] = React.useState({
    name: '',
    opponentUsername: '',
    matchId: ''
  });

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token) return;
    
    try {
      const response = await fetch('/api/h2h-matchups', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          matchId: parseInt(formData.matchId)
        })
      });
      
      if (response.ok) {
        setFormData({ name: '', opponentUsername: '', matchId: '' });
        alert('Head-to-head matchup created successfully!');
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error creating H2H matchup:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Head-to-Head Matchup</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Matchup Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Championship Final"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="opponentUsername">Opponent Username</Label>
            <Input
              id="opponentUsername"
              value={formData.opponentUsername}
              onChange={(e) => setFormData({ ...formData, opponentUsername: e.target.value })}
              placeholder="Enter opponent's username"
              required
            />
          </div>
          
          <div>
            <Label>Match</Label>
            <Select value={formData.matchId} onValueChange={(value) => setFormData({ ...formData, matchId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select match" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((match) => (
                  <SelectItem key={match.id} value={match.id.toString()}>
                    {match.match_name} - {new Date(match.date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full">Create Matchup</Button>
        </form>
      </CardContent>
    </Card>
  );
}
