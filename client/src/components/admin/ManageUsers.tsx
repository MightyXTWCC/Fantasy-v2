import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function ManageUsers() {
  const { token } = useAuth();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingUser, setEditingUser] = React.useState(null);
  const [editFormData, setEditFormData] = React.useState({
    username: '',
    email: '',
    budget: 0,
    is_admin: 0
  });

  const fetchUsers = async function() {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const handleEditUser = function(user) {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      budget: user.budget,
      is_admin: user.is_admin
    });
  };

  const handleUpdateUser = async function() {
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        toast.success('User updated successfully!');
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <Toaster />
      <div className="mb-6">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="space-y-4">
        {users.map((user) => {
          const totalPoints = user.team.reduce((sum, player) => {
            let points = player.points || 0;
            if (player.is_captain) points *= 2;
            return sum + points;
          }, 0);

          const totalSpent = user.team.reduce((sum, player) => sum + (player.purchase_price || 0), 0);

          return (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span>{user.username}</span>
                    {user.is_admin && <Badge variant="destructive">Admin</Badge>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-username">Username</Label>
                            <Input
                              id="edit-username"
                              value={editFormData.username}
                              onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                              id="edit-email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-budget">Budget</Label>
                            <Input
                              id="edit-budget"
                              type="number"
                              value={editFormData.budget}
                              onChange={(e) => setEditFormData({ ...editFormData, budget: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={editFormData.is_admin === 1}
                              onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_admin: checked ? 1 : 0 })}
                            />
                            <Label>Admin Access</Label>
                          </div>
                          
                          <Button onClick={handleUpdateUser} className="w-full">
                            Update User
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">${user.budget.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Team Size</p>
                    <p className="font-medium">{user.team.length}/5</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="font-medium">{totalPoints}</p>
                  </div>
                </div>

                {user.team.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Team Players:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {user.team.map((player, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <span className="font-medium">{player.name}</span>
                            {player.is_captain && <Badge variant="default" className="ml-2 text-xs">C</Badge>}
                            <p className="text-xs text-muted-foreground">{player.position}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{player.points} pts</p>
                            <p className="text-xs text-muted-foreground">${player.purchase_price?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {users.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No users found matching your search.' : 'No users found.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
