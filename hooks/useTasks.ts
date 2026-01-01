
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';

export function useTasks() {
  const { user } = useAuth();
  const { tasks: realtimeTasks } = useRealtimeData();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use realtime data from provider
  useEffect(() => {
    if (realtimeTasks) {
      const mappedTasks = realtimeTasks.map((task: any) => ({
        id: task.id,
        householdId: task.household_id,
        title: task.title,
        description: task.description,
        assignedToUserId: task.assigned_to_user_id,
        frequency: task.frequency,
        dueDate: task.due_date,
        status: task.status,
        createdByUserId: task.created_by_user_id,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      }));
      setTasks(mappedTasks);
      setIsLoading(false);
    }
  }, [realtimeTasks]);

  const loadTasks = useCallback(async () => {
    if (!user?.householdId) return;
    
    try {
      console.log('useTasks: Loading tasks');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', user.householdId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const mappedTasks = data.map((task: any) => ({
          id: task.id,
          householdId: task.household_id,
          title: task.title,
          description: task.description,
          assignedToUserId: task.assigned_to_user_id,
          frequency: task.frequency,
          dueDate: task.due_date,
          status: task.status,
          createdByUserId: task.created_by_user_id,
          completedAt: task.completed_at,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        }));
        setTasks(mappedTasks);
      }
    } catch (err: any) {
      console.error('useTasks: Error loading tasks:', err);
    }
  }, [user?.householdId]);

  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      console.log('useTasks: Creating task:', taskData.title);
      if (!user?.householdId) throw new Error('No household selected');

      // Perform database insert first
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

      if (error) {
        console.error('useTasks: Error creating task:', error);
        return { data: null, error: error.message };
      }

      console.log('useTasks: Task created successfully');
      
      // Add to state immediately after successful insert
      const newTask: Task = {
        id: data.id,
        householdId: data.household_id,
        title: data.title,
        description: data.description,
        assignedToUserId: data.assigned_to_user_id,
        frequency: data.frequency,
        dueDate: data.due_date,
        status: data.status,
        createdByUserId: data.created_by_user_id,
        completedAt: data.completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      setTasks(prev => [newTask, ...prev]);
      
      return { data, error: null };
    } catch (err: any) {
      console.error('useTasks: Error creating task:', err);
      return { data: null, error: err.message };
    }
  }, [user]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('useTasks: Updating task:', taskId);
      
      // Optimistic update - update UI first
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task };
          if (updates.title !== undefined) updatedTask.title = updates.title;
          if (updates.description !== undefined) updatedTask.description = updates.description;
          if (updates.assignedToUserId !== undefined) updatedTask.assignedToUserId = updates.assignedToUserId;
          if (updates.frequency !== undefined) updatedTask.frequency = updates.frequency;
          if (updates.dueDate !== undefined) updatedTask.dueDate = updates.dueDate;
          if (updates.status !== undefined) {
            updatedTask.status = updates.status;
            if (updates.status === 'completed') {
              updatedTask.completedAt = new Date().toISOString();
            }
          }
          return updatedTask;
        }
        return task;
      }));

      // Then update database
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.assignedToUserId !== undefined) dbUpdates.assigned_to_user_id = updates.assignedToUserId;
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
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

      if (error) {
        console.error('useTasks: Error updating task:', error);
        // Rollback on error - reload from server
        await loadTasks();
        return { data: null, error: error.message };
      }

      console.log('useTasks: Task updated successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useTasks: Error updating task:', err);
      await loadTasks();
      return { data: null, error: err.message };
    }
  }, [loadTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      console.log('useTasks: Deleting task:', taskId);
      
      // Optimistic delete - remove from UI first
      const taskToDelete = tasks.find(t => t.id === taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));

      // Then delete from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('useTasks: Error deleting task:', error);
        // Rollback on error - reload to restore consistency
        await loadTasks();
        return { error: error.message };
      }

      console.log('useTasks: Task deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useTasks: Error deleting task:', err);
      await loadTasks();
      return { error: err.message };
    }
  }, [tasks, loadTasks]);

  return {
    tasks,
    isLoading,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
