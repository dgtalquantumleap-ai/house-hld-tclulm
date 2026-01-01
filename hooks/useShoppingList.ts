
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

      // Perform database insert first
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
        return { data: null, error: error.message };
      }

      console.log('useShoppingList: Item added successfully');
      
      // Add to state immediately after successful insert
      const newItem: ShoppingItem = {
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
      };
      
      setItems(prev => [newItem, ...prev]);
      
      return { data, error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error adding item:', err);
      return { data: null, error: err.message };
    }
  }, [user]);

  const updateItem = useCallback(async (itemId: string, updates: Partial<ShoppingItem>) => {
    try {
      console.log('useShoppingList: Updating item:', itemId);
      
      // Optimistic update - update UI first
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        return item;
      }));

      // Then update database
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.purchased !== undefined) {
        dbUpdates.purchased = updates.purchased;
        dbUpdates.purchased_by_user_id = updates.purchased ? user?.id : null;
        dbUpdates.purchased_at = updates.purchased ? new Date().toISOString() : null;
      }

      const { data, error } = await supabase
        .from('shopping_items')
        .update(dbUpdates)
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

  const togglePurchased = useCallback(async (itemId: string, purchased: boolean) => {
    try {
      console.log('useShoppingList: Toggling purchased:', itemId, purchased);
      
      // Optimistic update - update UI first
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

      // Then update database
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
      
      // Optimistic delete - remove from UI first
      const itemToDelete = items.find(i => i.id === itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));

      // Then delete from database
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('useShoppingList: Error deleting item:', error);
        // Rollback on error - reload to restore consistency
        await loadItems();
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
    updateItem,
    togglePurchased,
    deleteItem,
  };
}
