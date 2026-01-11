
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HouseholdEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';

export function useEvents() {
  const { user } = useAuth();
  const { events: realtimeEvents, refreshAll } = useRealtimeData();
  const [events, setEvents] = useState<HouseholdEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with realtime data
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

  const refreshEvents = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const createEvent = useCallback(async (eventData: Partial<HouseholdEvent>) => {
    try {
      console.log('useEvents: Creating event:', eventData.title);
      if (!user?.householdId) throw new Error('No household selected');

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticEvent: HouseholdEvent = {
        id: tempId,
        householdId: user.householdId,
        title: eventData.title || '',
        date: eventData.date || '',
        time: eventData.time,
        description: eventData.description,
        createdByUserId: user.id,
        assignedToUserId: eventData.assignedToUserId,
        repeat: eventData.repeat || 'none',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmationStatus: eventData.confirmationStatus || 'pending',
        calendarSource: eventData.calendarSource,
        externalEventId: eventData.externalEventId,
      };

      // Optimistic update - add immediately to UI
      setEvents(prev => [optimisticEvent, ...prev]);

      // Perform database insert
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
          reminder_minutes: eventData.reminderMinutes,
        }])
        .select()
        .single();

      if (error) {
        console.error('useEvents: Error creating event:', error);
        // Rollback optimistic update
        setEvents(prev => prev.filter(e => e.id !== tempId));
        return { data: null, error: error.message };
      }

      console.log('useEvents: Event created successfully');
      
      // Replace optimistic event with real data
      setEvents(prev => prev.map(e => {
        if (e.id === tempId) {
          return {
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
          };
        }
        return e;
      }));
      
      return { data, error: null };
    } catch (err: any) {
      console.error('useEvents: Error creating event:', err);
      return { data: null, error: err.message };
    }
  }, [user]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<HouseholdEvent>) => {
    try {
      console.log('useEvents: Updating event:', eventId);
      
      // Store original event for rollback
      const originalEvent = events.find(e => e.id === eventId);
      if (!originalEvent) {
        return { data: null, error: 'Event not found' };
      }

      // Optimistic update - update UI first
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

      // Then update database
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
        .select();

      if (error) {
        console.error('useEvents: Error updating event:', error);
        // Rollback on error
        setEvents(prev => prev.map(e => e.id === eventId ? originalEvent : e));
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        console.error('useEvents: Event not found or update blocked by RLS');
        setEvents(prev => prev.map(e => e.id === eventId ? originalEvent : e));
        return { data: null, error: 'Event not found or you do not have permission to update it' };
      }

      console.log('useEvents: Event updated successfully');
      return { data: data[0], error: null };
    } catch (err: any) {
      console.error('useEvents: Error updating event:', err);
      return { data: null, error: err.message };
    }
  }, [events]);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      console.log('useEvents: Deleting event:', eventId);
      
      // Store event for rollback
      const eventToDelete = events.find(e => e.id === eventId);
      if (!eventToDelete) {
        return { error: 'Event not found' };
      }

      // Optimistic delete - remove from UI first
      setEvents(prev => prev.filter(e => e.id !== eventId));

      // Then delete from database
      const { error } = await supabase
        .from('household_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('useEvents: Error deleting event:', error);
        // Rollback on error - restore event
        setEvents(prev => [eventToDelete, ...prev]);
        return { error: error.message };
      }

      console.log('useEvents: Event deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useEvents: Error deleting event:', err);
      return { error: err.message };
    }
  }, [events]);

  return {
    events,
    isLoading,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
