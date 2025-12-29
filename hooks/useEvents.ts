
import { supabase } from '@/lib/supabase';
import { HouseholdEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useEvents() {
  const { user } = useAuth();

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
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
