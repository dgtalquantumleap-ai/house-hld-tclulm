
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface RecurrencePattern {
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  days?: string[]; // For weekly: ['monday', 'wednesday']
  endDate?: string;
}

export function useRecurringTasks() {
  const [loading, setLoading] = useState(false);

  async function createRecurringTask(
    taskData: any,
    recurrence: RecurrencePattern
  ) {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tasks').insert({
        ...taskData,
        is_recurring: true,
        recurrence_pattern: recurrence.pattern,
        recurrence_interval: recurrence.interval,
        recurrence_days: recurrence.days,
        recurrence_end_date: recurrence.endDate,
      }).select().single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }

  async function completeRecurringInstance(taskId: string, createNext: boolean) {
    try {
      // Mark current as completed
      await supabase.from('tasks').update({ 
        completed: true,
        completed_at: new Date().toISOString()
      }).eq('id', taskId);

      if (createNext) {
        // Get parent task details
        const { data: task } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();

        if (task?.is_recurring) {
          // Create next occurrence
          const nextDate = calculateNextDate(
            new Date(task.due_date),
            task.recurrence_pattern,
            task.recurrence_interval
          );

          await supabase.from('tasks').insert({
            title: task.title,
            description: task.description,
            household_id: task.household_id,
            assigned_to_user_id: task.assigned_to_user_id,
            due_date: nextDate.toISOString(),
            is_recurring: true,
            recurrence_pattern: task.recurrence_pattern,
            recurrence_interval: task.recurrence_interval,
            recurrence_days: task.recurrence_days,
            parent_task_id: task.parent_task_id || task.id,
          });
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  return { createRecurringTask, completeRecurringInstance, loading };
}

function calculateNextDate(current: Date, pattern: string, interval: number): Date {
  const next = new Date(current);
  if (pattern === 'daily') next.setDate(next.getDate() + interval);
  else if (pattern === 'weekly') next.setDate(next.getDate() + interval * 7);
  else if (pattern === 'monthly') next.setMonth(next.getMonth() + interval);
  return next;
}
