
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useTasks() {
  const { user } = useAuth();

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
    createTask,
    updateTask,
    deleteTask,
  };
}
