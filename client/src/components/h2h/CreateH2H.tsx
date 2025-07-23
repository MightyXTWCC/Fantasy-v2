import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoundsData } from '@/hooks/useRoundsData';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function CreateH2H() {
  const { rounds } = useRoundsData();
  const { token, user } = useAuth();
  const [users, setUsers] = React.useState([]);
  
  const [formData, setFormData] = React.useState({
    name: '',
    user1Username: '',
    user2Username: '',
    roundId: ''
  });

  React.useEffect(() => {
    const fetchUsers = async function() {
      if (!token || !user?.is_admin) return;
      
      try {
        const response = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setUsers(data.filter(u => !u.is_admin)); // Don't show admin users
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [token, user]);

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
          roundId: parseInt(formData.roundId)
        })
      });
      
      if (response.ok) {
        setFormData({ name: '', user1Username: '', user2Username: '', roundId: '' });
        toast.success('Head-to-head matchup created successfully!', {
          duration: 4000,
          position: 'top-center',
        });
      } else {
        const error = await response.json();
        toast.error(error.error, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error creating H2H matchup:', error);
      toast.error('Failed to create matchup', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  // Only show this form to admin users
  if (!user?.is_admin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Only administrators can create head-to-head matchups.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Toaster />
      <Card>
        <CardHeader>
          <CardTitle>Create Head-to-Head Matchup (Admin Only)</CardTitle>
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
              <Label>Player 1</Label>
              <Select value={formData.user1Username} onValueChange={(value) => setFormData({ ...formData, user1Username: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first player" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Player 2</Label>
              <Select value={formData.user2Username} onValueChange={(value) => setFormData({ ...formData, user2Username: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second player" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.username !== formData.user1Username)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.username}>
                        {user.username}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Round</Label>
              <Select value={formData.roundId} onValueChange={(value) => setFormData({ ...formData, roundId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select round" />
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
            
            <Button type="submit" className="w-full">Create Matchup</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
