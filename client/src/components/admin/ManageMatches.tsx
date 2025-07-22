import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

export function ManageMatches() {
  const { token } = useAuth();
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchMatches = async function() {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const response = await fetch(`/api/matches?${params}`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMatches();
  }, [searchQuery]);

  const handleDeleteMatch = async function(matchId: number, matchName: string) {
    if (!confirm(`Are you sure you want to delete "${matchName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Match deleted successfully!');
        fetchMatches();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Failed to delete match');
    }
  };

  if (loading) {
    return <div>Loading matches...</div>;
  }

  return (
    <div>
      <Toaster />
      <div className="mb-6">
        <Input
          placeholder="Search matches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <Card key={match.id}>
            <CardHeader>
              <CardTitle>{match.match_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Date:</strong> {new Date(match.date).toLocaleDateString()}</p>
                <p><strong>Teams:</strong> {match.team1} vs {match.team2}</p>
                <Button 
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={() => handleDeleteMatch(match.id, match.match_name)}
                >
                  Delete Match
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {matches.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No matches found matching your search.' : 'No matches available.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
