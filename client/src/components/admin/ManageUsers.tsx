import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // For team management
  const [managingTeam, setManagingTeam] = React.useState(null);
  const [players, setPlayers] = React.useState([]);
  const [addPlayerForm, setAddPlayerForm] = React.useState({
    playerId: '',
    isSubstitute: false
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

  const fetchPlayers = async function() {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  React.useEffect(() => {
    fetchUsers();
    fetchPlayers();
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

  const handleDeleteUser = async function(userId: number, username: string) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone and will remove all their team data.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('User deleted successfully!');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleAddPlayerToTeam = async function() {
    if (!managingTeam || !addPlayerForm.playerId) return;

    try {
      const response = await fetch(`/api/admin/users/${managingTeam.id}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          playerId: parseInt(addPlayerForm.playerId),
          isSubstitute: addPlayerForm.isSubstitute
        })
      });

      if (response.ok) {
        toast.success('Player added to team successfully!');
        setAddPlayerForm({ playerId: '', isSubstitute: false });
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add player to team');
      }
    } catch (error) {
      console.error('Error adding player to team:', error);
      toast.error('Failed to add player to team');
    }
  };

  const handleRemovePlayerFromTeam = async function(userId: number, playerId: number, playerName: string) {
    if (!confirm(`Remove ${playerName} from this user's team?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/players/${playerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Player removed from team successfully!');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove player from team');
      }
    } catch (error) {
      console.error('Error removing player from team:', error);
      toast.error('Failed to remove player from team');
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
            let points = (player.total_points || 0) + (player.current_points || 0);
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

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" onClick={() => setManagingTeam(user)}>
                          Manage Team
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Manage Team: {managingTeam?.username}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Add Player to Team */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Add Player to Team</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <Select 
                                  value={addPlayerForm.playerId} 
                                  onValueChange={(value) => setAddPlayerForm({ ...addPlayerForm, playerId: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select player to add" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {players
                                      .filter(p => !managingTeam?.team.some(t => t.player_id === p.id))
                                      .map((player) => (
                                        <SelectItem key={player.id} value={player.id.toString()}>
                                          {player.name} ({player.position}) - ${player.current_price.toLocaleString()}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="isSubstitute"
                                  checked={addPlayerForm.isSubstitute}
                                  onChange={(e) => setAddPlayerForm({ ...addPlayerForm, isSubstitute: e.target.checked })}
                                />
                                <Label htmlFor="isSubstitute" className="text-sm">As Substitute</Label>
                              </div>
                            </div>
                            <Button 
                              onClick={handleAddPlayerToTeam} 
                              className="mt-3"
                              disabled={!addPlayerForm.playerId}
                            >
                              Add Player
                            </Button>
                          </div>

                          {/* Current Team */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Current Team ({managingTeam?.team.length}/7)</h4>
                            {managingTeam?.team.length > 0 ? (
                              <div className="space-y-2">
                                {managingTeam.team.map((player) => (
                                  <div key={player.player_id} className="flex justify-between items-center p-2 bg-muted rounded">
                                    <div>
                                      <span className="font-medium">{player.name}</span>
                                      {player.is_captain && <Badge variant="default" className="ml-2 text-xs">C</Badge>}
                                      {player.is_substitute && <Badge variant="outline" className="ml-2 text-xs">SUB</Badge>}
                                      <p className="text-xs text-muted-foreground">
                                        {player.position} • {player.total_points + player.current_points} pts • ${player.purchase_price?.toLocaleString()}
                                      </p>
                                    </div>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRemovePlayerFromTeam(managingTeam.id, player.player_id, player.name)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No players in team</p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                    >
                      Delete
                    </Button>
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
                    <p className="font-medium">{user.team.length}/7</p>
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
                            {player.is_substitute && <Badge variant="outline" className="ml-2 text-xs">SUB</Badge>}
                            <p className="text-xs text-muted-foreground">{player.position}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{(player.total_points || 0) + (player.current_points || 0)} pts</p>
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
