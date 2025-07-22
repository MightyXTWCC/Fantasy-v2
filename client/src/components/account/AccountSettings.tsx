import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function AccountSettings() {
  const { user, token } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username,
        email: user.email
      }));
    }
  }, [user]);

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!formData.currentPassword) {
      toast.error('Current password is required');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (response.ok) {
        toast.success('Account updated successfully!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        // Refresh the page to update the user context
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update account');
      }
    } catch (error) {
      console.error('Account update error:', error);
      toast.error('Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toaster />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Required to save changes"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">New Password (optional)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Leave empty to keep current password"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
