import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PositionIcon } from '@/components/ui/position-icon';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function PlayersList() {
  const { user, token } = useAuth();
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('name');

  const fetchPlayers = async function() {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (sortBy) {
        params.append('sortBy', sortBy);
      }
      
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/players?${params}`, { headers });
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPlayers();
  }, [searchQuery, sortBy, token]);

  const handleBuyPlayer = async function(playerId: number, isSubstitute = false) {
    if (!token) return;

    try {
      const response = await fetch('/api/buy-player', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ playerId, isSubstitute })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message, {
          duration: 4000,
          position: 'top-center',
        });
        fetchPlayers();
        window.location.reload(); // Refresh to update budget
      } else {
        const error = await response.json();
        if (response.status === 423) {
          toast.error('Team changes are locked during active round', {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          toast.error(error.error, {
            duration: 4000,
            position: 'top-center',
          });
        }
      }
    } catch (error) {
      console.error('Error buying player:', error);
      toast.error('Failed to buy player', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  if (loading) {
    return <div>Loading players...</div>;
  }

  // Group players by position for better organization
  const playersByPosition = {
    'Wicket-keeper': players.filter(p => p.position === 'Wicket-keeper'),
    'Batsman': players.filter(p => p.position === 'Batsman'),
    'All-rounder': players.filter(p => p.position === 'All-rounder'),
    'Bowler': players.filter(p => p.position === 'Bowler')
  };

  const renderPlayerCard = function(player) {
    const currentPoints = player.current_round_points || 0;
    const totalPoints = player.total_points || 0;
    const isOwned = player.owned_by_user;

    return (
      <Card key={player.id} className={`hover:shadow-lg transition-shadow ${isOwned ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <PositionIcon position={player.position} className="w-5 h-5" />
              <span className="text-sm">{player.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{player.position}</Badge>
              {isOwned && <Badge variant="default" className="text-xs bg-green-600">OWNED</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Price:</strong> ${player.current_price.toLocaleString()}</p>
            <p><strong>Round Points:</strong> {currentPoints} <span className="text-muted-foreground">({totalPoints})</span></p>
            
            {!isOwned ? (
              <div className="space-y-2 