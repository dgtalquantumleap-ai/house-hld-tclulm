
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useShoppingList() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.householdId) {
      loadItems();
      subscribeToItems();
    } else {
      setIsLoading(false);
    }
  }, [user?.householdId]);

  const loadItems = async () => {
    try {
      console.log('useShoppingList: Loading items for household:', user?.householdId);
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('household_id', user?.householdId)
        .order('purchased', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedItems: ShoppingItem[] = data.map(item => ({
          id: item.id,
          householdId: item.household_id,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          addedByUserId: item.added_by_user_id,
          purchased: item.purchased,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
        setItems(mappedItems);
      }
    } catch (err: any) {
      console.error('useShoppingList: Error loading items:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToItems = () => {
    console.log('useShoppingList: Subscribing to real-time updates');
    const subscription = supabase
      .channel('shopping_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `household_id=eq.${user?.householdId}`,
        },
        (payload) => {
          console.log('useShoppingList: Real-time update received:', payload);
          loadItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const addItem = async (name: string, quantity?: string, category?: string) => {
    try {
      console.log('useShoppingList: Adding item:', name);
      if (!user?.householdId) throw new Error('No household selected');

      const { data, error } = await supabase
        .from('shopping_items')
        .insert([{
          household_id: user.householdId,
          name,
          quantity,
          category,
          added_by_user_id: user.id,
          purchased: false,
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('useShoppingList: Item added successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error adding item:', err);
      return { data: null, error: err.message };
    }
  };

  const togglePurchased = async (itemId: string, purchased: boolean) => {
    try {
      console.log('useShoppingList: Toggling purchased:', itemId, purchased);
      const { data, error } = await supabase
        .from('shopping_items')
        .update({ 
          purchased,
          purchased_by_user_id: purchased ? user?.id : null,
          purchased_at: purchased ? new Date().toISOString() : null,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      console.log('useShoppingList: Item updated successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error updating item:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      console.log('useShoppingList: Deleting item:', itemId);
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      console.log('useShoppingList: Item deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error deleting item:', err);
      return { error: err.message };
    }
  };

  return {
    items,
    isLoading,
    error,
    addItem,
    togglePurchased,
    deleteItem,
    refreshItems: loadItems,
  };
}
