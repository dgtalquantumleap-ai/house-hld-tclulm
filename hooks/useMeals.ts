
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Meal, MealIngredient } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';

export function useMeals() {
  const { user } = useAuth();
  const { meals: realtimeMeals, refreshAll } = useRealtimeData();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with realtime data
  useEffect(() => {
    if (realtimeMeals) {
      const mappedMeals = realtimeMeals.map((meal: any) => ({
        id: meal.id,
        householdId: meal.household_id,
        title: meal.title,
        description: meal.description,
        mealDate: meal.meal_date,
        mealTime: meal.meal_time,
        assignedToUserId: meal.assigned_to_user_id,
        createdByUserId: meal.created_by_user_id,
        createdAt: meal.created_at,
        updatedAt: meal.updated_at,
      }));
      setMeals(mappedMeals);
      setIsLoading(false);
    }
  }, [realtimeMeals]);

  const refreshMeals = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const createMeal = useCallback(async (
    title: string,
    mealDate: string,
    mealTime?: string,
    description?: string,
    assignedToUserId?: string,
    ingredients?: { name: string; quantity?: string }[]
  ) => {
    try {
      console.log('useMeals: Creating meal:', title);
      if (!user?.householdId) throw new Error('No household');

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticMeal: Meal = {
        id: tempId,
        householdId: user.householdId,
        title,
        description,
        mealDate,
        mealTime,
        assignedToUserId,
        createdByUserId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update - add immediately to UI
      setMeals(prev => [optimisticMeal, ...prev]);

      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert({
          household_id: user.householdId,
          title,
          description,
          meal_date: mealDate,
          meal_time: mealTime,
          assigned_to_user_id: assignedToUserId,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (mealError) {
        console.error('useMeals: Error creating meal:', mealError);
        // Rollback optimistic update
        setMeals(prev => prev.filter(m => m.id !== tempId));
        return { data: null, error: mealError.message };
      }

      // Add ingredients if provided
      if (ingredients && ingredients.length > 0) {
        const ingredientsData = ingredients.map(ing => ({
          meal_id: mealData.id,
          ingredient_name: ing.name,
          quantity: ing.quantity,
        }));

        const { error: ingredientsError } = await supabase
          .from('meal_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) {
          console.error('useMeals: Error adding ingredients:', ingredientsError);
        }

        // Optionally add to shopping list
        const shoppingItems = ingredients.map(ing => ({
          household_id: user.householdId,
          name: ing.name,
          quantity: ing.quantity,
          category: 'Meal Ingredients',
          added_by_user_id: user.id,
          purchased: false,
        }));

        await supabase.from('shopping_items').insert(shoppingItems);
      }

      // Create calendar event
      await supabase.from('household_events').insert({
        household_id: user.householdId,
        title: `Meal: ${title}`,
        date: mealDate,
        time: mealTime,
        description: description,
        created_by_user_id: user.id,
        assigned_to_user_id: assignedToUserId,
      });

      console.log('useMeals: Meal created successfully');
      
      // Replace optimistic meal with real data
      setMeals(prev => prev.map(m => {
        if (m.id === tempId) {
          return {
            id: mealData.id,
            householdId: mealData.household_id,
            title: mealData.title,
            description: mealData.description,
            mealDate: mealData.meal_date,
            mealTime: mealData.meal_time,
            assignedToUserId: mealData.assigned_to_user_id,
            createdByUserId: mealData.created_by_user_id,
            createdAt: mealData.created_at,
            updatedAt: mealData.updated_at,
          };
        }
        return m;
      }));
      
      return { data: mealData, error: null };
    } catch (error: any) {
      console.error('useMeals: Error creating meal:', error);
      return { data: null, error: error.message };
    }
  }, [user]);

  const updateMeal = useCallback(async (
    mealId: string,
    updates: Partial<Meal>
  ) => {
    try {
      console.log('useMeals: Updating meal:', mealId);

      // Store original meal for rollback
      const originalMeal = meals.find(m => m.id === mealId);
      if (!originalMeal) {
        return { error: 'Meal not found' };
      }

      // Optimistic update
      setMeals(prev => prev.map(meal => {
        if (meal.id === mealId) {
          return { ...meal, ...updates };
        }
        return meal;
      }));

      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.mealDate !== undefined) dbUpdates.meal_date = updates.mealDate;
      if (updates.mealTime !== undefined) dbUpdates.meal_time = updates.mealTime;
      if (updates.assignedToUserId !== undefined) dbUpdates.assigned_to_user_id = updates.assignedToUserId;

      const { error } = await supabase
        .from('meals')
        .update(dbUpdates)
        .eq('id', mealId);

      if (error) {
        console.error('useMeals: Error updating meal:', error);
        // Rollback on error
        setMeals(prev => prev.map(m => m.id === mealId ? originalMeal : m));
        return { error: error.message };
      }

      console.log('useMeals: Meal updated successfully');
      return { error: null };
    } catch (error: any) {
      console.error('useMeals: Error updating meal:', error);
      return { error: error.message };
    }
  }, [meals]);

  const deleteMeal = useCallback(async (mealId: string) => {
    try {
      console.log('useMeals: Deleting meal:', mealId);

      // Store meal for rollback
      const mealToDelete = meals.find(m => m.id === mealId);
      if (!mealToDelete) {
        return { error: 'Meal not found' };
      }

      // Optimistic delete
      setMeals(prev => prev.filter(m => m.id !== mealId));

      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) {
        console.error('useMeals: Error deleting meal:', error);
        // Rollback on error
        setMeals(prev => [mealToDelete, ...prev]);
        return { error: error.message };
      }

      console.log('useMeals: Meal deleted successfully');
      return { error: null };
    } catch (error: any) {
      console.error('useMeals: Error deleting meal:', error);
      return { error: error.message };
    }
  }, [meals]);

  const getMealIngredients = async (mealId: string): Promise<MealIngredient[]> => {
    try {
      const { data, error } = await supabase
        .from('meal_ingredients')
        .select('*')
        .eq('meal_id', mealId);

      if (error) throw error;

      const ingredients = data.map(ing => ({
        id: ing.id,
        mealId: ing.meal_id,
        shoppingItemId: ing.shopping_item_id,
        ingredientName: ing.ingredient_name,
        quantity: ing.quantity,
        createdAt: ing.created_at,
      }));
      
      return ingredients;
    } catch (error) {
      console.error('useMeals: Error loading meal ingredients:', error);
      return [];
    }
  };

  return {
    meals,
    isLoading,
    refreshMeals,
    createMeal,
    updateMeal,
    deleteMeal,
    getMealIngredients,
  };
}
