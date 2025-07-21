import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMatchesData } from '@/hooks/useMatchesData';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function CreateH2H() {
  const { matches } = useMatchesData();
  const { token, user } = useAuth();
  const [users, setUsers] = React.useState([]);
  
  const [formData, setFormData] = React.useState({
    name: '',
    user1Username: '',
    user2Username: '',
    matchId: ''
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
          matchId: parseInt(formData.matchId)
        })
      });
      
      if (response.ok) {
        setFormData({ name: '', user1Username: '', user2Username: '', matchId: '' });
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
    </div>
  );
}
