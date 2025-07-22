import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function CreateRound() {
  const { token } = useAuth();
  const [formData, setFormData] = React.useState({
    name: '',
    round_number: 1,
    lockout_time: ''
  });

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token) return;
    
    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormData({ name: '', round_number: 1, lockout_time: '' });
        toast.success('Round created successfully!', {
          duration: 4000,
          position: 'top-center',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create round', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error creating round:', error);
      toast.error('Failed to create round', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  return (
    <div>
      <Toaster />
      <Card>
        <CardHeader>
          <CardTitle>Create New Round</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Round Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Round 1 - Opening Weekend"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="round_number">Round Number</Label>
              <Input
                id="round_number"
                type="number"
                min="1"
                value={formData.round_number}
                onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="lockout_time">Lockout Time (AEST)</Label>
              <Input
                id="lockout_time"
                type="datetime-local"
                value={formData.lockout_time}
                onChange={(e) => setFormData({ ...formData, lockout_time: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Team changes will be locked at this time
              </p>
            </div>
            
            <Button type="submit" className="w-full">Create Round</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
