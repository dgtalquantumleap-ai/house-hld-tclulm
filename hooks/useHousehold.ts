
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Household } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useHousehold() {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.householdId) {
      loadHousehold();
    } else {
      setIsLoading(false);
    }
  }, [user?.householdId]);

  const loadHousehold = async () => {
    try {
      console.log('useHousehold: Loading household:', user?.householdId);
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('id', user?.householdId)
        .single();

      if (error) throw error;

      if (data) {
        setHousehold({
          id: data.id,
          name: data.name,
          address: data.address,
          createdByUserId: data.created_by_user_id,
          membersCount: data.members_count,
          inviteCode: data.invite_code,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (err: any) {
      console.error('useHousehold: Error loading household:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createHousehold = async (name: string, address?: string) => {
    try {
      console.log('useHousehold: Creating household:', name);
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('households')
        .insert([{
          name,
          address,
          created_by_user_id: user.id,
          members_count: 1,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update user's household_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ household_id: data.id })
        .eq('id', user.id);

      if (updateError) throw updateError;

      console.log('useHousehold: Household created successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useHousehold: Error creating household:', err);
      return { data: null, error: err.message };
    }
  };

  const joinHousehold = async (inviteCode: string) => {
    try {
      console.log('useHousehold: Joining household with code:', inviteCode);
      if (!user) throw new Error('User not authenticated');

      // Find household by invite code
      const { data: householdData, error: findError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (findError) throw new Error('Invalid invite code');

      // Update user's household_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ household_id: householdData.id })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Increment members count
      const { error: incrementError } = await supabase
        .from('households')
        .update({ members_count: householdData.members_count + 1 })
        .eq('id', householdData.id);

      if (incrementError) throw incrementError;

      console.log('useHousehold: Joined household successfully');
      return { data: householdData, error: null };
    } catch (err: any) {
      console.error('useHousehold: Error joining household:', err);
      return { data: null, error: err.message };
    }
  };

  return {
    household,
    isLoading,
    error,
    createHousehold,
    joinHousehold,
    refreshHousehold: loadHousehold,
  };
}
