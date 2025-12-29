
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useShoppingList() {
  const { user } = useAuth();

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
    addItem,
    togglePurchased,
    deleteItem,
  };
}
