
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HouseholdEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';

export function useEvents() {
  const { user } = useAuth();
  const { events: realtimeEvents } = useRealtimeData();
  const [events, setEvents] = useState<HouseholdEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use realtime data from provider
  useEffect(() => {
    if (realtimeEvents) {
      const mappedEvents = realtimeEvents.map((event: any) => ({
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
        confirmationStatus: event.confirmation_status,
        calendarSource: event.calendar_source,
        externalEventId: event.external_event_id,
      }));
      setEvents(mappedEvents);
      setIsLoading(false);
    }
  }, [realtimeEvents]);

  const loadEvents = useCallback(async () => {
    if (!user?.householdId) return;
    
    try {
      console.log('useEvents: Loading events');
      const { data, error } = await supabase
        .from('household_events')
        .select('*')
        .eq('household_id', user.householdId)
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const mappedEvents = data.map((event: any) => ({
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
          confirmationStatus: event.confirmation_status,
          calendarSource: event.calendar_source,
          externalEventId: event.external_event_id,
        }));
        setEvents(mappedEvents);
      }
    } catch (err: any) {
      console.error('useEvents: Error loading events:', err);
    }
  }, [user?.householdId]);

  const refreshEvents = useCallback(async () => {
    await loadEvents();
  }, [loadEvents]);

  const createEvent = useCallback(async (eventData: Partial<HouseholdEvent>) => {
    try {
      console.log('useEvents: Creating event:', eventData.title);
      if (!user?.householdId) throw new Error('No household selected');

      // Optimistic update - add temporary event immediately
      const tempId = `temp-${Date.now()}`;
      const optimisticEvent: HouseholdEvent = {
        id: tempId,
        householdId: user.householdId,
        title: eventData.title || '',
        date: eventData.date || '',
        time: eventData.time || null,
        description: eventData.description || null,
        createdByUserId: user.id,
        assignedToUserId: eventData.assignedToUserId || null,
        repeat: eventData.repeat || 'none',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmationStatus: eventData.confirmationStatus || 'pending',
        calendarSource: eventData.calendarSource || null,
        externalEventId: eventData.externalEventId || null,
      };

      // Add optimistic event to UI immediately
      setEvents(prev => [optimisticEvent, ...prev]);

      // Perform actual database insert
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
          confirmation_status: eventData.confirmationStatus || 'pending',
        }])
        .select()
        .single();

      if (error) {
        console.error('useEvents: Error creating event:', error);
        // Rollback optimistic update on error
        setEvents(prev => prev.filter(e => e.id !== tempId));
        return { data: null, error: error.message };
      }

      console.log('useEvents: Event created successfully');
      // Replace temp event with real event
      setEvents(prev => prev.map(e => e.id === tempId ? {
        id: data.id,
        householdId: data.household_id,
        title: data.title,
        date: data.date,
        time: data.time,
        description: data.description,
        createdByUserId: data.created_by_user_id,
        assignedToUserId: data.assigned_to_user_id,
        repeat: data.repeat,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        confirmationStatus: data.confirmation_status,
        calendarSource: data.calendar_source,
        externalEventId: data.external_event_id,
      } : e));
      
      return { data, error: null };
    } catch (err: any) {
      console.error('useEvents: Error creating event:', err);
      return { data: null, error: err.message };
    }
  }, [user]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<HouseholdEvent>) => {
    try {
      console.log('useEvents: Updating event:', eventId);
      
      // Optimistic update
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          const updatedEvent = { ...event };
          if (updates.title !== undefined) updatedEvent.title = updates.title;
          if (updates.date !== undefined) updatedEvent.date = updates.date;
          if (updates.time !== undefined) updatedEvent.time = updates.time;
          if (updates.description !== undefined) updatedEvent.description = updates.description;
          if (updates.assignedToUserId !== undefined) updatedEvent.assignedToUserId = updates.assignedToUserId;
          if (updates.repeat !== undefined) updatedEvent.repeat = updates.repeat;
          if (updates.confirmationStatus !== undefined) updatedEvent.confirmationStatus = updates.confirmationStatus;
          return updatedEvent;
        }
        return event;
      }));

      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.time !== undefined) dbUpdates.time = updates.time;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.assignedToUserId !== undefined) dbUpdates.assigned_to_user_id = updates.assignedToUserId;
      if (updates.repeat !== undefined) dbUpdates.repeat = updates.repeat;
      if (updates.confirmationStatus !== undefined) dbUpdates.confirmation_status = updates.confirmationStatus;

      const { data, error } = await supabase
        .from('household_events')
        .update(dbUpdates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('useEvents: Error updating event:', error);
        // Rollback on error
        await loadEvents();
        return { data: null, error: error.message };
      }

      console.log('useEvents: Event updated successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useEvents: Error updating event:', err);
      await loadEvents();
      return { data: null, error: err.message };
    }
  }, [loadEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      console.log('useEvents: Deleting event:', eventId);
      
      // Optimistic delete - remove from UI immediately
      const eventToDelete = events.find(e => e.id === eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));

      const { error } = await supabase
        .from('household_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('useEvents: Error deleting event:', error);
        // Rollback on error - restore the event
        if (eventToDelete) {
          setEvents(prev => [...prev, eventToDelete]);
        }
        return { error: error.message };
      }

      console.log('useEvents: Event deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useEvents: Error deleting event:', err);
      await loadEvents();
      return { error: err.message };
    }
  }, [events, loadEvents]);

  return {
    events,
    isLoading,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
