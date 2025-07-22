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
      is_