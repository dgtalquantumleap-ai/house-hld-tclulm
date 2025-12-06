
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { HouseholdEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<HouseholdEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user?.householdId) {
      loadEvents();
      subscribeToEvents();
    } else {
      setIsLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log('useEvents: Unsubscribing from real-time updates');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.householdId]);

  const loadEvents = async () => {
    try {
      console.log('useEvents: Loading events for household:', user?.householdId);
      const { data, error } = await supabase
        .from('household_events')
        .select('id, household_id, title, date, time, description, created_by_user_id, assigned_to_user_id, repeat, created_at, updated_at')
        .eq('household_id', user?.householdId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedEvents: HouseholdEvent[] = data.map(event => ({
          id: event.id,
          householdId: event.household_id,
          title: event.title,
          date: event.date,
          time: event.time,
          description: event.description,
          createdByUserId: event.created_by_user_id,
          assignedToUserId: event.assigned_to_user_id,
          repeat: event.repeat,
          createdAt: event.created_at,
          updatedAt: event.updated_at,
        }));
        setEvents(mappedEvents);
      }
    } catch (err: any) {
      console.error('useEvents: Error loading events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToEvents = () => {
    // Prevent duplicate subscriptions
    if (channelRef.current) {
      console.log('useEvents: Already subscribed to real-time updates');
      return;
    }

    console.log('useEvents: Subscribing to real-time event updates');
    const channel = supabase
      .channel(`household_events_changes_${user?.householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_events',
          filter: `household_id=eq.${user?.householdId}`,
        },
        (payload) => {
          console.log('useEvents: Real-time update received:', payload.eventType);
          loadEvents();
        }
      )
      .subscribe((status) => {
        console.log('useEvents: Subscription status:', status);
      });

    channelRef.current = channel;
  };

  const createEvent = async (eventData: Partial<HouseholdEvent>) => {
    try {
      console.log('useEvents: Creating event:', eventData.title);
      if (!user?.householdId) throw new Error('No household selected');

      const { data, error } = await supabase
        .from('household_events')
        .insert([{
          household_id: user.householdId,
          title: eventData.title,
          date: eventData.date,
          time: eventData.time,
          description: eventData.description,
          assigned_to_user_id: eventData.assignedToUserId,
          repeat: eventData.repeat || 'none',
          created_by_user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('useEvents: Event created successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useEvents: Error creating event:', err);
      return { data: null, error: err.message };
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<HouseholdEvent>) => {
    try {
      console.log('useEvents: Updating event:', eventId);
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.time !== undefined) dbUpdates.time = updates.time;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.assignedToUserId !== undefined) dbUpdates.assigned_to_user_id = updates.assignedToUserId;
      if (updates.repeat !== undefined) dbUpdates.repeat = updates.repeat;

      const { data, error } = await supabase
        .from('household_events')
        .update(dbUpdates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      console.log('useEvents: Event updated successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useEvents: Error updating event:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      console.log('useEvents: Deleting event:', eventId);
      const { error } = await supabase
        .from('household_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      console.log('useEvents: Event deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useEvents: Error deleting event:', err);
      return { error: err.message };
    }
  };

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: loadEvents,
  };
}
