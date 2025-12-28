
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { HouseholdEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeCache } from '@/utils/realtimeCache';

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<HouseholdEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (user?.householdId) {
      loadEvents();
      
      // Listen to centralized realtime events
      const handleUpdate = () => {
        console.log('useEvents: Received realtime update event');
        realtimeCache.throttle(
          `events_reload_${user?.householdId}`,
          () => {
            realtimeCache.invalidate(`events_${user?.householdId}`);
            loadEvents(true);
          },
          1000
        );
      };

      window.addEventListener('events-updated', handleUpdate as EventListener);

      return () => {
        window.removeEventListener('events-updated', handleUpdate as EventListener);
      };
    } else {
      setIsLoading(false);
    }
  }, [user?.householdId]);

  const loadEvents = async (skipCache = false) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('useEvents: Load already in progress, skipping');
      return;
    }

    try {
      loadingRef.current = true;
      const cacheKey = `events_${user?.householdId}`;

      // Check cache first (unless explicitly skipped)
      if (!skipCache) {
        const cached = realtimeCache.get<HouseholdEvent[]>(cacheKey);
        if (cached) {
          setEvents(cached);
          setIsLoading(false);
          return;
        }
      }

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
        
        // Cache the results for 3 seconds
        realtimeCache.set(cacheKey, mappedEvents, 3000);
      }
    } catch (err: any) {
      console.error('useEvents: Error loading events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
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
      
      // Invalidate cache immediately for instant UI update
      realtimeCache.invalidate(`events_${user?.householdId}`);
      
      // Reload events immediately
      await loadEvents(true);
      
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
      
      // Invalidate cache immediately for instant UI update
      realtimeCache.invalidate(`events_${user?.householdId}`);
      
      // Reload events immediately
      await loadEvents(true);
      
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
      
      // Invalidate cache immediately for instant UI update
      realtimeCache.invalidate(`events_${user?.householdId}`);
      
      // Reload events immediately to update the UI
      await loadEvents(true);
      
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
    refreshEvents: () => loadEvents(true),
  };
}
