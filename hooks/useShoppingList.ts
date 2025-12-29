
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';

export function useShoppingList() {
  const { user } = useAuth();
  const { shoppingItems: realtimeItems } = useRealtimeData();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use realtime data from provider
  useEffect(() => {
    if (realtimeItems) {
      const mappedItems = realtimeItems.map((item: any) => ({
        id: item.id,
        householdId: item.household_id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        addedByUserId: item.added_by_user_id,
        purchased: item.purchased,
        purchasedByUserId: item.purchased_by_user_id,
        purchasedAt: item.purchased_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
      setItems(mappedItems);
      setIsLoading(false);
    }
  }, [realtimeItems]);

  const refreshItems = async () => {
    if (!user?.householdId) return;
    
    try {
      console.log('useShoppingList: Refreshing items');
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('household_id', user.householdId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const mappedItems = data.map((item: any) => ({
          id: item.id,
          householdId: item.household_id,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          addedByUserId: item.added_by_user_id,
          purchased: item.purchased,
          purchasedByUserId: item.purchased_by_user_id,
          purchasedAt: item.purchased_at,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
        setItems(mappedItems);
      }
    } catch (err: any) {
      console.error('useShoppingList: Error refreshing items:', err);
    }
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
    refreshItems,
    addItem,
    togglePurchased,
    deleteItem,
  };
}
