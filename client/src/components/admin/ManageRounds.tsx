import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useRoundsData } from '@/hooks/useRoundsData';
import toast, { Toaster } from 'react-hot-toast';

export function ManageRounds() {
  const { token } = useAuth();
  const { rounds, refetch } = useRoundsData();
  const [editingRound, setEditingRound] = React.useState(null);
  const [editFormData, setEditFormData] = React.useState({
    name: '',
    round_number: 1,
    lockout_time: '',
    is_active: false
  });

  const handleEditRound = function(round) {
    setEditingRound(round);
    const lockoutDate = new Date(round.lockout_time);
    const localDateTime = new Date(lockoutDate.getTime() - lockoutDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setEditFormData({
      name: round.name,
      round_number: round.round_number,
      lockout_time: localDateTime,
      is_active: round.is_active === 1
    });
  };

  const handleUpdateRound = async function() {
    try {
      const response = await fetch(`/api/rounds/${editingRound.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editFormData,
          is_active: editFormData.is_active ? 1 : 0
        })
      });

      if (response.ok) {
        toast.success('Round updated successfully!');
        setEditingRound(null);
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update round');
      }
    } catch (error) {
      console.error('Error updating round:', error);
      toast.error('Failed to update round');
    }
  };

  const handleDeleteRound = async function(roundId: number, roundName: string) {
    if (!confirm(`Are you sure you want to delete "${roundName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Round deleted successfully!');
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete round');
      }
    } catch (error) {
      console.error('Error deleting round:', error);
      toast.error('Failed to delete round');
    }
  };

  const handleStartRound = async function(roundId: number, roundName: string) {
    if (!confirm(`Are you sure you want to start "${roundName}"? This will finalize the previous round and reset current round points.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/start-round/${roundId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('New round started successfully!');
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start round');
      }
    } catch (error) {
      console.error('Error starting round:', error);
      toast.error('Failed to start round');
    }
  };

  return (
    <div>
      <Toaster />
      <div className="space-y-4">
        {rounds.map((round) => {
          const lockoutTime = new Date(round.lockout_time);
          const now = new Date();
          const isLocked = now >= lockoutTime || round.is_locked;
          const isActive = round.is_active;

          return (
            <Card key={round.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{round.name}</span>
                  <div className="space-x-2">
                    {isActive && <Badge variant="default">Active</Badge>}
                    <Badge variant={isLocked ? 'destructive' : 'secondary'}>
                      {isLocked ? 'Locked' : 'Open'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p><strong>Round:</strong> {round.round_number}</p>
                  <p><strong>Lockout:</strong> {lockoutTime.toLocaleString('en-AU', {
                    timeZone: 'Australia/Sydney',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}</p>
                  <p><strong>Created:</strong> {new Date(round.created_at).toLocaleDateString()}</p>
                </div>
                
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEditRound(round)}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Round: {editingRound?.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Round Name</Label>
                          <Input
                            id="edit-name"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-round-number">Round Number</Label>
                          <Input
                            id="edit-round-number"
                            type="number"
                            min="1"
                            value={editFormData.round_number}
                            onChange={(e) => setEditFormData({ ...editFormData, round_number: parseInt(e.target.value) })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-lockout-time">Lockout Time</Label>
                          <Input
                            id="edit-lockout-time"
                            type="datetime-local"
                            value={editFormData.lockout_time}
                            onChange={(e) => setEditFormData({ ...editFormData, lockout_time: e.target.value })}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editFormData.is_active}
                            onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_active: checked })}
                          />
                          <Label>Set as Active Round</Label>
                        </div>
                        
                        <Button onClick={handleUpdateRound} className="w-full">
                          Update Round
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => handleStartRound(round.id, round.name)}
                    disabled={isActive}
                  >
                    {isActive ? 'Current Round' : 'Start Round'}
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRound(round.id, round.name)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {rounds.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No rounds created yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
