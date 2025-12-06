
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user?.householdId) {
      loadTasks();
      subscribeToTasks();
    } else {
      setIsLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log('useTasks: Unsubscribing from real-time updates');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.householdId]);

  const loadTasks = async () => {
    try {
      console.log('useTasks: Loading tasks for household:', user?.householdId);
      const { data, error } = await supabase
        .from('tasks')
        .select('id, household_id, title, description, assigned_to_user_id, frequency, due_date, status, created_by_user_id, completed_at, created_at, updated_at')
        .eq('household_id', user?.householdId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedTasks: Task[] = data.map(task => ({
          id: task.id,
          householdId: task.household_id,
          title: task.title,
          description: task.description,
          assignedToUserId: task.assigned_to_user_id,
          frequency: task.frequency,
          dueDate: task.due_date,
          status: task.status,
          createdByUserId: task.created_by_user_id,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        }));
        setTasks(mappedTasks);
      }
    } catch (err: any) {
      console.error('useTasks: Error loading tasks:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToTasks = () => {
    // Prevent duplicate subscriptions
    if (channelRef.current) {
      console.log('useTasks: Already subscribed to real-time updates');
      return;
    }

    console.log('useTasks: Subscribing to real-time task updates');
    const channel = supabase
      .channel(`tasks_changes_${user?.householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `household_id=eq.${user?.householdId}`,
        },
        (payload) => {
          console.log('useTasks: Real-time update received:', payload.eventType);
          loadTasks();
        }
      )
      .subscribe((status) => {
        console.log('useTasks: Subscription status:', status);
      });

    channelRef.current = channel;
  };

  const createTask = async (taskData: Partial<Task>) => {
    try {
      console.log('useTasks: Creating task:', taskData.title);
      if (!user?.householdId) throw new Error('No household selected');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          household_id: user.householdId,
          title: taskData.title,
          description: taskData.description,
          assigned_to_user_id: taskData.assignedToUserId,
          frequency: taskData.frequency || 'one-time',
          due_date: taskData.dueDate,
          status: taskData.status || 'pending',
          created_by_user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('useTasks: Task created successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useTasks: Error creating task:', err);
      return { data: null, error: err.message };
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('useTasks: Updating task:', taskId);
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.assignedToUserId !== undefined) dbUpdates.assigned_to_user_id = updates.assignedToUserId;
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
        // Set completed_at when marking as completed
        if (updates.status === 'completed') {
          dbUpdates.completed_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      console.log('useTasks: Task updated successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useTasks: Error updating task:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      console.log('useTasks: Deleting task:', taskId);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      console.log('useTasks: Task deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useTasks: Error deleting task:', err);
      return { error: err.message };
    }
  };

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: loadTasks,
  };
}
