import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUsers = async function() {
      if (!token) return;
      
      try {
        const response = await fetch('/api/admin/users', {
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

    fetchUsers();
  }, [token]);

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">All Users & Teams</h3>
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
                <div className="text-right text-sm">
                  <p>Budget: ${user.budget.toLocaleString()}</p>
                  <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="text-lg font-bold">{user.team.length}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-lg font-bold">{totalPoints}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-lg font-bold">${totalSpent.toLocaleString()}</p>
                </div>
              </div>

              {user.team.length > 0 ? (
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
              ) : (
                <p className="text-muted-foreground text-center py-4">No players in team</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
