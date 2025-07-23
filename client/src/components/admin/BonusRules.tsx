import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useRoundsData } from '@/hooks/useRoundsData';
import toast, { Toaster } from 'react-hot-toast';

export function BonusRules() {
  const { token } = useAuth();
  const { rounds } = useRoundsData();
  const [selectedRound, setSelectedRound] = React.useState('');
  const [bonusRules, setBonusRules] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    bonus_points: 0,
    target_positions: ['All'],
    conditions: {
      min_runs: '',
      max_runs: '',
      min_wickets: '',
      max_wickets: '',
      min_catches: '',
      min_sixes: '',
      min_fours: ''
    }
  });

  const positions = ['All', 'Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

  React.useEffect(() => {
    if (selectedRound) {
      fetchBonusRules();
    }
  }, [selectedRound]);

  const fetchBonusRules = async function() {
    if (!selectedRound || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rounds/${selectedRound}/bonus-rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBonusRules(data);
    } catch (error) {
      console.error('Error fetching bonus rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = function(position: string, checked: boolean) {
    if (position === 'All') {
      setFormData({
        ...formData,
        target_positions: checked ? ['All'] : []
      });
    } else {
      let newPositions = formData.target_positions.filter(p => p !== 'All');
      if (checked) {
        newPositions.push(position);
      } else {
        newPositions = newPositions.filter(p => p !== position);
      }
      setFormData({
        ...formData,
        target_positions: newPositions.length === 0 ? ['All'] : newPositions
      });
    }
  };

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token || !selectedRound) return;

    // Filter out empty conditions
    const conditions = {};
    Object.entries(formData.conditions).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        conditions[key] = parseInt(value.toString());
      }
    });
    
    try {
      const response = await fetch(`/api/rounds/${selectedRound}/bonus-rules`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          bonus_points: parseInt(formData.bonus_points.toString()),
          conditions
        })
      });
      
      if (response.ok) {
        setFormData({
          name: '',
          description: '',
          bonus_points: 0,
          target_positions: ['All'],
          conditions: {
            min_runs: '',
            max_runs: '',
            min_wickets: '',
            max_wickets: '',
            min_catches: '',
            min_sixes: '',
            min_fours: ''
          }
        });
        toast.success('Bonus rule created successfully!');
        fetchBonusRules();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create bonus rule');
      }
    } catch (error) {
      console.error('Error creating bonus rule:', error);
      toast.error('Failed to create bonus rule');
    }
  };

  const handleDeleteRule = async function(ruleId: number, ruleName: string) {
    if (!confirm(`Delete bonus rule "${ruleName}"?`)) return;

    try {
      const response = await fetch(`/api/bonus-rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Bonus rule deleted successfully!');
        fetchBonusRules();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete bonus rule');
      }
    } catch (error) {
      console.error('Error deleting bonus rule:', error);
      toast.error('Failed to delete bonus rule');
    }
  };

  const selectedRoundName = rounds.find(r => r.id.toString() === selectedRound)?.name;

  return (
    <div>
      <Toaster />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bonus Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Round</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a round to manage bonus rules" />
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

            {selectedRound && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Create custom bonus rules for <strong>{selectedRoundName}</strong>. 
                  These rules are applied when calculating player points.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedRound && (
        <>
          {/* Create New Bonus Rule */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create Bonus Rule</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Big Bowling Performance"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bonus_points">Bonus Points</Label>
                    <Input
                      id="bonus_points"
                      type="number"
                      value={formData.bonus_points}
                      onChange={(e) => setFormData({ ...formData, bonus_points: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 20, 40"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Bowlers who take 2+ wickets get bonus points"
                    required
                  />
                </div>

                <div>
                  <Label>Target Positions</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {positions.map((position) => (
                      <div key={position} className="flex items-center space-x-2">
                        <Checkbox
                          id={position}
                          checked={formData.target_positions.includes(position)}
                          onCheckedChange={(checked) => handlePositionChange(position, checked as boolean)}
                        />
                        <Label htmlFor={position} className="text-sm">{position}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Conditions (leave empty if not needed)</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="min_runs" className="text-xs">Min Runs</Label>
                      <Input
                        id="min_runs"
                        type="number"
                        value={formData.conditions.min_runs}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, min_runs: e.target.value }
                        })}
                        placeholder="e.g., 20"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="min_wickets" className="text-xs">Min Wickets</Label>
                      <Input
                        id="min_wickets"
                        type="number"
                        value={formData.conditions.min_wickets}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, min_wickets: e.target.value }
                        })}
                        placeholder="e.g., 2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="min_catches" className="text-xs">Min Catches</Label>
                      <Input
                        id="min_catches"
                        type="number"
                        value={formData.conditions.min_catches}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, min_catches: e.target.value }
                        })}
                        placeholder="e.g., 1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="min_sixes" className="text-xs">Min Sixes</Label>
                      <Input
                        id="min_sixes"
                        type="number"
                        value={formData.conditions.min_sixes}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, min_sixes: e.target.value }
                        })}
                        placeholder="e.g., 3"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="min_fours" className="text-xs">Min Fours</Label>
                      <Input
                        id="min_fours"
                        type="number"
                        value={formData.conditions.min_fours}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, min_fours: e.target.value }
                        })}
                        placeholder="e.g., 5"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="max_runs" className="text-xs">Max Runs</Label>
                      <Input
                        id="max_runs"
                        type="number"
                        value={formData.conditions.max_runs}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, max_runs: e.target.value }
                        })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
                
                <Button type="submit" disabled={!formData.name || !formData.description}>
                  Create Bonus Rule
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Bonus Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Current Bonus Rules for {selectedRoundName}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading bonus rules...</p>
              ) : bonusRules.length > 0 ? (
                <div className="space-y-4">
                  {bonusRules.map((rule) => (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                          
                          <div className="flex items-center space-x-4 mt-3">
                            <Badge variant="default">+{rule.bonus_points} points</Badge>
                            <div className="flex space-x-1">
                              {rule.target_positions.map((position) => (
                                <Badge key={position} variant="outline" className="text-xs">
                                  {position}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {Object.keys(rule.conditions).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">Conditions:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(rule.conditions).map(([key, value]) => (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    {key.replace('_', ' ')}: {value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No bonus rules created for this round yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
