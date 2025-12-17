
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HouseholdInvitation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.householdId) {
      loadInvitations();
      subscribeToInvitations();
    } else {
      setIsLoading(false);
    }
  }, [user?.householdId]);

  const loadInvitations = async () => {
    try {
      console.log('useInvitations: Loading invitations');
      const { data, error } = await supabase
        .from('household_invitations')
        .select('*')
        .eq('household_id', user?.householdId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setInvitations(data.map(inv => ({
          id: inv.id,
          householdId: inv.household_id,
          email: inv.email,
          invitedByUserId: inv.invited_by_user_id,
          status: inv.status,
          createdAt: inv.created_at,
          acceptedAt: inv.accepted_at,
        })));
      }
    } catch (error) {
      console.error('useInvitations: Error loading invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToInvitations = () => {
    const channel = supabase
      .channel('household_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_invitations',
          filter: `household_id=eq.${user?.householdId}`,
        },
        () => {
          console.log('useInvitations: Invitations changed, reloading');
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendInvitation = async (email: string) => {
    try {
      console.log('useInvitations: Sending invitation to:', email);
      if (!user?.householdId) throw new Error('No household');

      const { data, error } = await supabase
        .from('household_invitations')
        .insert({
          household_id: user.householdId,
          email: email.toLowerCase(),
          invited_by_user_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send email notification via Edge Function
      console.log('useInvitations: Invitation sent successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('useInvitations: Error sending invitation:', error);
      return { data: null, error: error.message };
    }
  };

  const updateInvitationStatus = async (invitationId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('household_invitations')
        .update({
          status,
          accepted_at: status === 'accepted' ? new Date().toISOString() : null,
        })
        .eq('id', invitationId);

      if (error) throw error;

      console.log('useInvitations: Invitation status updated');
      return { error: null };
    } catch (error: any) {
      console.error('useInvitations: Error updating invitation:', error);
      return { error: error.message };
    }
  };

  return {
    invitations,
    isLoading,
    sendInvitation,
    updateInvitationStatus,
    refreshInvitations: loadInvitations,
  };
}
