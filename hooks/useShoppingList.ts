
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';

export function useShoppingList() {
  const { user } = useAuth();
  const { shoppingItems: realtimeItems, refreshAll } = useRealtimeData();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with realtime data
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

  const refreshItems = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const addItem = useCallback(async (name: string, quantity?: string, category?: string) => {
    try {
      console.log('useShoppingList: Adding item:', name);
      if (!user?.householdId) throw new Error('No household selected');

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: ShoppingItem = {
        id: tempId,
        householdId: user.householdId,
        name,
        quantity,
        category,
        addedByUserId: user.id,
        purchased: false,
        purchasedByUserId: null,
        purchasedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update - add immediately to UI
      setItems(prev => [optimisticItem, ...prev]);

      // Perform database insert
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
        // Rollback optimistic update
        setItems(prev => prev.filter(i => i.id !== tempId));
        return { data: null, error: error.message };
      }

      console.log('useShoppingList: Item added successfully');
      
      // Replace optimistic item with real data
      setItems(prev => prev.map(i => {
        if (i.id === tempId) {
          return {
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
        }
        return i;
      }));
      
      return { data, error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error adding item:', err);
      return { data: null, error: err.message };
    }
  }, [user]);

  const updateItem = useCallback(async (itemId: string, updates: Partial<ShoppingItem>) => {
    try {
      console.log('useShoppingList: Updating item:', itemId);
      
      // Store original item for rollback
      const originalItem = items.find(i => i.id === itemId);
      if (!originalItem) {
        return { data: null, error: 'Item not found' };
      }

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
        .select();

      if (error) {
        console.error('useShoppingList: Error updating item:', error);
        // Rollback on error
        setItems(prev => prev.map(i => i.id === itemId ? originalItem : i));
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        console.error('useShoppingList: Item not found or update blocked by RLS');
        setItems(prev => prev.map(i => i.id === itemId ? originalItem : i));
        return { data: null, error: 'Item not found or you do not have permission to update it' };
      }

      console.log('useShoppingList: Item updated successfully');
      return { data: data[0], error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error updating item:', err);
      return { data: null, error: err.message };
    }
  }, [user, items]);

  const togglePurchased = useCallback(async (itemId: string, purchased: boolean) => {
    try {
      console.log('useShoppingList: Toggling purchased:', itemId, purchased);
      
      // Store original item for rollback
      const originalItem = items.find(i => i.id === itemId);
      if (!originalItem) {
        return { data: null, error: 'Item not found' };
      }

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
        .select();

      if (error) {
        console.error('useShoppingList: Error updating item:', error);
        // Rollback on error
        setItems(prev => prev.map(i => i.id === itemId ? originalItem : i));
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        console.error('useShoppingList: Item not found or update blocked by RLS');
        setItems(prev => prev.map(i => i.id === itemId ? originalItem : i));
        return { data: null, error: 'Item not found or you do not have permission to update it' };
      }

      console.log('useShoppingList: Item updated successfully');
      return { data: data[0], error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error updating item:', err);
      return { data: null, error: err.message };
    }
  }, [user, items]);

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      console.log('useShoppingList: Deleting item:', itemId);
      
      // Store item for rollback
      const itemToDelete = items.find(i => i.id === itemId);
      if (!itemToDelete) {
        return { error: 'Item not found' };
      }

      // Optimistic delete - remove from UI first
      setItems(prev => prev.filter(i => i.id !== itemId));

      // Then delete from database
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('useShoppingList: Error deleting item:', error);
        // Rollback on error - restore item
        setItems(prev => [itemToDelete, ...prev]);
        return { error: error.message };
      }

      console.log('useShoppingList: Item deleted successfully');
      return { error: null };
    } catch (err: any) {
      console.error('useShoppingList: Error deleting item:', err);
      return { error: err.message };
    }
  }, [items]);

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
