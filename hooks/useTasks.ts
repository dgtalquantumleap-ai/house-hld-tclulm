
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';

export function useTasks() {
  const { user } = useAuth();
  const { tasks: realtimeTasks, refreshAll } = useRealtimeData();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with realtime data
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

  const refreshTasks = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      console.log('useTasks: Creating task:', taskData.title);
      if (!user?.householdId) throw new Error('No household selected');

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        householdId: user.householdId,
        title: taskData.title || '',
        description: taskData.description,
        assignedToUserId: taskData.assignedToUserId,
        frequency: taskData.frequency || 'one-time',
        dueDate: taskData.dueDate,
        status: taskData.status || 'pending',
        createdByUserId: user.id,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update - add immediately to UI
      setTasks(prev => [optimisticTask, ...prev]);

      // Perform database insert
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
        // Rollback optimistic update
        setTasks(prev => prev.filter(t => t.id !== tempId));
        return { data: null, error: error.message };
      }

      console.log('useTasks: Task created successfully');
      
      // Replace optimistic task with real data
      setTasks(prev => prev.map(t => {
        if (t.id === tempId) {
          return {
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
        }
        return t;
      }));
      
      return { data, error: null };
    } catch (err: any) {
      console.error('useTasks: Error creating task:', err);
      return { data: null, error: err.message };
    }
  }, [user]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('useTasks: Updating task:', taskId);
      
      // Store original task for rollback
      const originalTask = tasks.find(t => t.id === taskId);
      if (!originalTask) {
        return { data: null, error: 'Task not found' };
      }

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
        .select();

      if (error) {
        console.error('useTasks: Error updating task:', error);
        // Rollback on error - restore original task
        setTasks(prev => prev.map(t => t.id === taskId ? originalTask : t));
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        console.error('useTasks: Task not found or update blocked by RLS');
        setTasks(prev => prev.map(t => t.id === taskId ? originalTask : t));
        return { data: null, error: 'Task not found or you do not have permission to update it' };
      }

      console.log('useTasks: Task updated successfully');
      return { data: data[0], error: null };
    } catch (err: any) {
      console.error('useTasks: Error updating task:', err);
      return { data: null, error: err.message };
    }
  }, [tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      console.log('useTasks: Deleting task:', taskId);
      
      // Store task for rollback
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (!taskToDelete) {
        return { error: 'Task not found' };
      }

      // Optimistic delete - remove from UI first
      setTasks(prev => prev.filter(t => t.id !== taskId));

      // Then delete from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('useTasks: Error deleting task:', error);
        // Rollback on error - restore task
        setTasks(prev => [taskToDelete, ...prev]);
        return { error: error.message };
      }

      console.log('useTasks: Task deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useTasks: Error deleting task:', err);
      return { error: err.message };
    }
  }, [tasks]);

  return {
    tasks,
    isLoading,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
