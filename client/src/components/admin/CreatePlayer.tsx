import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CreatePlayer() {
  const [formData, setFormData] = React.useState({
    name: '',
    team: '',
    position: '',
    base_price: 100000
  });

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormData({ name: '', team: '', position: '', base_price: 100000 });
        alert('Player created successfully!');
      }
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Player</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Player Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="team">Team</Label>
            <Input
              id="team"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label>Position</Label>
            <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Batsman">Batsman</SelectItem>
                <SelectItem value="Bowler">Bowler</SelectItem>
                <SelectItem value="All-rounder">All-rounder</SelectItem>
                <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="base_price">Base Price</Label>
            <Input
              id="base_price"
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) })}
              required
            />
          </div>
          
          <Button type="submit" className="w-full">Create Player</Button>
        </form>
      </CardContent>
    </Card>
  );
}
