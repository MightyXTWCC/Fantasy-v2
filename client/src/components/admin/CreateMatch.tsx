import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

export function CreateMatch() {
  const { token } = useAuth();
  const [formData, setFormData] = React.useState({
    match_name: '',
    date: '',
    team1: '',
    team2: ''
  });

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token) return;
    
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormData({ match_name: '', date: '', team1: '', team2: '' });
        alert('Match created successfully!');
      }
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Match</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="match_name">Match Name</Label>
            <Input
              id="match_name"
              value={formData.match_name}
              onChange={(e) => setFormData({ ...formData, match_name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="team1">Team 1</Label>
            <Input
              id="team1"
              value={formData.team1}
              onChange={(e) => setFormData({ ...formData, team1: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="team2">Team 2</Label>
            <Input
              id="team2"
              value={formData.team2}
              onChange={(e) => setFormData({ ...formData, team2: e.target.value })}
              required
            />
          </div>
          
          <Button type="submit" className="w-full">Create Match</Button>
        </form>
      </CardContent>
    </Card>
  );
}
