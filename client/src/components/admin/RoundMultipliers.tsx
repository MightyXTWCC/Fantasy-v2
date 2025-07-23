import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRoundsData } from '@/hooks/useRoundsData';
import toast, { Toaster } from 'react-hot-toast';

export function RoundMultipliers() {
  const { token } = useAuth();
  const { rounds } = useRoundsData();
  const [selectedRound, setSelectedRound] = React.useState('');
  const [multipliers, setMultipliers] = React.useState([]);
  const [players, setPlayers] = React.useState([]);
  const [loading