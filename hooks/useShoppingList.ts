
import { useState, useEffect, useCallback } from 'react';
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

  const loadItems = useCallback(async () => {
    if (!user?.householdId) return;
    
    try {
      console.log('useShoppingList: Loading items');
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
      console.error('useShoppingList: Error loading items:', err);
    }
  }, [user?.householdId]);

  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  const addItem = useCallback(async (name: string, quantity?: string, category?: string) => {
    try {
      console.log('useShoppingList: Adding item:', name);
      if (!user?.householdId) throw new Error('No household selected');

      // Optimistic update - add temporary item immediately
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: ShoppingItem = {
        id: tempId,
        householdId: user.householdId,
        name,
        quantity: quantity || null,
        category: category || null,
        addedByUserId: user.id,
        purchased: false,
        purchasedByUserId: null,
        purchasedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add optimistic item to UI immediately
      setItems(prev => [optimisticItem, ...prev]);

      // Perform actual database insert
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

      if (error) {
        console.error('useShoppingList: Error adding item:', error);
        // Rollback optimistic update on error
        setItems(prev => prev.filter(i => i.id !== tempId));
        return { data: null, error: error.message };
      }

      console.log('useShoppingList: Item added successfully');
      // Replace temp item with real item
      setItems(prev => prev.map(i => i.id === tempId ? {
        id: data.id,
        householdId: data.household_id,
        name: data.name,
        quantity: data.quantity,
        category: data.category,
        addedByUserId: data.added_by_user_id,
        purchased: data.purchased,
        purchasedByUserId: data.purchased_by_user_id,
        purchasedAt: data.purchased_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } : i));
      
      return { data, error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error adding item:', err);
      return { data: null, error: err.message };
    }
  }, [user]);

  const togglePurchased = useCallback(async (itemId: string, purchased: boolean) => {
    try {
      console.log('useShoppingList: Toggling purchased:', itemId, purchased);
      
      // Optimistic update
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            purchased,
            purchasedByUserId: purchased ? user?.id || null : null,
            purchasedAt: purchased ? new Date().toISOString() : null,
          };
        }
        return item;
      }));

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

      if (error) {
        console.error('useShoppingList: Error updating item:', error);
        // Rollback on error
        await loadItems();
        return { data: null, error: error.message };
      }

      console.log('useShoppingList: Item updated successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error updating item:', err);
      await loadItems();
      return { data: null, error: err.message };
    }
  }, [user, loadItems]);

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      console.log('useShoppingList: Deleting item:', itemId);
      
      // Optimistic delete - remove from UI immediately
      const itemToDelete = items.find(i => i.id === itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));

      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('useShoppingList: Error deleting item:', error);
        // Rollback on error - restore the item
        if (itemToDelete) {
          setItems(prev => [...prev, itemToDelete]);
        }
        return { error: error.message };
      }

      console.log('useShoppingList: Item deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error deleting item:', err);
      await loadItems();
      return { error: err.message };
    }
  }, [items, loadItems]);

  return {
    items,
    isLoading,
    refreshItems,
    addItem,
    togglePurchased,
    deleteItem,
  };
}
