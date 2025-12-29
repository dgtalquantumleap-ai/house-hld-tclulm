
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
  tasks: any[];
  shoppingItems: any[];
  events: any[];
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID, clearing data and skipping subscriptions');
      setTasks([]);
      setShoppingItems([]);
      setEvents([]);
      return;
    }

    console.log('[RealtimeProvider] Setting up subscriptions for household:', user.householdId);

    // Initial load
    loadTasks();
    loadShop();
    loadEvents();

    const tasksChannel = supabase
      .channel(`tasks-${user.householdId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `household_id=eq.${user.householdId}`
      }, (payload) => {
        console.log('[RealtimeProvider] Tasks change detected:', payload.eventType);
        loadTasks();
      })
      .subscribe((status) => {
        console.log('[RealtimeProvider] Tasks channel status:', status);
      });

    const shopChannel = supabase
      .channel(`shop-${user.householdId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: `household_id=eq.${user.householdId}`
      }, (payload) => {
        console.log('[RealtimeProvider] Shopping change detected:', payload.eventType);
        loadShop();
      })
      .subscribe((status) => {
        console.log('[RealtimeProvider] Shopping channel status:', status);
      });

    const eventsChannel = supabase
      .channel(`events-${user.householdId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'household_events',
        filter: `household_id=eq.${user.householdId}`
      }, (payload) => {
        console.log('[RealtimeProvider] Events change detected:', payload.eventType);
        loadEvents();
      })
      .subscribe((status) => {
        console.log('[RealtimeProvider] Events channel status:', status);
      });

    return () => {
      console.log('[RealtimeProvider] Cleaning up subscriptions');
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(shopChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [user?.householdId]);

  const loadTasks = async () => {
    if (!user?.householdId) return;
    
    try {
      console.log('[RealtimeProvider] Loading tasks for household:', user.householdId);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', user.householdId)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading tasks:', error);
        return;
      }
      
      if (data) {
        console.log('[RealtimeProvider] Loaded', data.length, 'tasks');
        setTasks(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading tasks:', error);
    }
  };

  const loadShop = async () => {
    if (!user?.householdId) return;
    
    try {
      console.log('[RealtimeProvider] Loading shopping items for household:', user.householdId);
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('household_id', user.householdId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading shopping items:', error);
        return;
      }
      
      if (data) {
        console.log('[RealtimeProvider] Loaded', data.length, 'shopping items');
        setShoppingItems(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading shopping items:', error);
    }
  };

  const loadEvents = async () => {
    if (!user?.householdId) return;
    
    try {
      console.log('[RealtimeProvider] Loading events for household:', user.householdId);
      const { data, error } = await supabase
        .from('household_events')
        .select('*')
        .eq('household_id', user.householdId)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading events:', error);
        return;
      }
      
      if (data) {
        console.log('[RealtimeProvider] Loaded', data.length, 'events');
        setEvents(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading events:', error);
    }
  };

  return (
    <RealtimeContext.Provider value={{ tasks, shoppingItems, events }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtimeData = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeData must be used within a RealtimeProvider');
  }
  return context;
};
