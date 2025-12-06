
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user?.householdId) {
      loadExpenses();
      subscribeToExpenses();
    } else {
      setIsLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log('useExpenses: Unsubscribing from real-time updates');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.householdId]);

  const loadExpenses = async () => {
    try {
      console.log('useExpenses: Loading expenses for household:', user?.householdId);
      const { data, error } = await supabase
        .from('expenses')
        .select('id, household_id, title, amount, category, created_by_user_id, paid_by_user_id, date, created_at')
        .eq('household_id', user?.householdId)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedExpenses: Expense[] = data.map(expense => ({
          id: expense.id,
          householdId: expense.household_id,
          title: expense.title,
          amount: parseFloat(expense.amount),
          category: expense.category,
          createdByUserId: expense.created_by_user_id,
          paidByUserId: expense.paid_by_user_id,
          date: expense.date,
          createdAt: expense.created_at,
        }));
        setExpenses(mappedExpenses);
      }
    } catch (err: any) {
      console.error('useExpenses: Error loading expenses:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToExpenses = () => {
    // Prevent duplicate subscriptions
    if (channelRef.current) {
      console.log('useExpenses: Already subscribed to real-time updates');
      return;
    }

    console.log('useExpenses: Subscribing to real-time expense updates');
    const channel = supabase
      .channel(`expenses_changes_${user?.householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `household_id=eq.${user?.householdId}`,
        },
        (payload) => {
          console.log('useExpenses: Real-time update received:', payload.eventType);
          loadExpenses();
        }
      )
      .subscribe((status) => {
        console.log('useExpenses: Subscription status:', status);
      });

    channelRef.current = channel;
  };

  const createExpense = async (expenseData: Partial<Expense>) => {
    try {
      console.log('useExpenses: Creating expense:', expenseData.title);
      if (!user?.householdId) throw new Error('No household selected');

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          household_id: user.householdId,
          title: expenseData.title,
          amount: expenseData.amount,
          category: expenseData.category,
          paid_by_user_id: expenseData.paidByUserId || user.id,
          date: expenseData.date || new Date().toISOString().split('T')[0],
          created_by_user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('useExpenses: Expense created successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useExpenses: Error creating expense:', err);
      return { data: null, error: err.message };
    }
  };

  const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
    try {
      console.log('useExpenses: Updating expense:', expenseId);
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.paidByUserId !== undefined) dbUpdates.paid_by_user_id = updates.paidByUserId;
      if (updates.date !== undefined) dbUpdates.date = updates.date;

      const { data, error } = await supabase
        .from('expenses')
        .update(dbUpdates)
        .eq('id', expenseId)
        .select()
        .single();

      if (error) throw error;

      console.log('useExpenses: Expense updated successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useExpenses: Error updating expense:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      console.log('useExpenses: Deleting expense:', expenseId);
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      console.log('useExpenses: Expense deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useExpenses: Error deleting expense:', err);
      return { error: err.message };
    }
  };

  const getTotalByCategory = () => {
    const totals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      totals[category] = (totals[category] || 0) + expense.amount;
    });
    return totals;
  };

  const getTotalAmount = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  return {
    expenses,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses: loadExpenses,
    getTotalByCategory,
    getTotalAmount,
  };
}
