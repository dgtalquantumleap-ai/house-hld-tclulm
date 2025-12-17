
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Meal, MealIngredient } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useMeals() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.householdId) {
      loadMeals();
      subscribeToMeals();
    } else {
      setIsLoading(false);
    }
  }, [user?.householdId]);

  const loadMeals = async () => {
    try {
      console.log('useMeals: Loading meals');
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('household_id', user?.householdId)
        .order('meal_date', { ascending: true });

      if (error) throw error;

      if (data) {
        setMeals(data.map(meal => ({
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
        })));
      }
    } catch (error) {
      console.error('useMeals: Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMeals = () => {
    const channel = supabase
      .channel('meals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `household_id=eq.${user?.householdId}`,
        },
        () => {
          console.log('useMeals: Meals changed, reloading');
          loadMeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createMeal = async (
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

      if (mealError) throw mealError;

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

        if (ingredientsError) throw ingredientsError;

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
      return { data: mealData, error: null };
    } catch (error: any) {
      console.error('useMeals: Error creating meal:', error);
      return { data: null, error: error.message };
    }
  };

  const updateMeal = async (
    mealId: string,
    updates: Partial<Meal>
  ) => {
    try {
      console.log('useMeals: Updating meal:', mealId);

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

      if (error) throw error;

      console.log('useMeals: Meal updated successfully');
      return { error: null };
    } catch (error: any) {
      console.error('useMeals: Error updating meal:', error);
      return { error: error.message };
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      console.log('useMeals: Deleting meal:', mealId);

      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) throw error;

      console.log('useMeals: Meal deleted successfully');
      return { error: null };
    } catch (error: any) {
      console.error('useMeals: Error deleting meal:', error);
      return { error: error.message };
    }
  };

  const getMealIngredients = async (mealId: string): Promise<MealIngredient[]> => {
    try {
      const { data, error } = await supabase
        .from('meal_ingredients')
        .select('*')
        .eq('meal_id', mealId);

      if (error) throw error;

      return data.map(ing => ({
        id: ing.id,
        mealId: ing.meal_id,
        shoppingItemId: ing.shopping_item_id,
        ingredientName: ing.ingredient_name,
        quantity: ing.quantity,
        createdAt: ing.created_at,
      }));
    } catch (error) {
      console.error('useMeals: Error loading meal ingredients:', error);
      return [];
    }
  };

  return {
    meals,
    isLoading,
    createMeal,
    updateMeal,
    deleteMeal,
    getMealIngredients,
    refreshMeals: loadMeals,
  };
}
