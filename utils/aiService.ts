
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

/**
 * AI Service - Calls the Supabase Edge Function for AI-powered features
 * 
 * This service handles:
 * - Meal suggestions
 * - Auto shopping list generation
 * - Nutrition information
 * 
 * All requests are authenticated and gated by premium status on the backend.
 */

export interface AIActionRequest {
  action: 'meal_suggestion' | 'auto_shopping' | 'nutrition_info';
  context: {
    household_id: string;
    [key: string]: any;
  };
}

export interface AIActionResponse {
  success: boolean;
  result: {
    meal?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    shopping_items?: Array<{ name: string; quantity?: string; category?: string }>;
    [key: string]: any;
  };
  error?: string;
}

/**
 * Call the AI Smart Action Edge Function
 * 
 * @param action - The AI action to perform
 * @param context - Context data including household_id
 * @returns Response from the Edge Function
 * @throws Error if the request fails or user is not authenticated
 */
export async function callAISmartAction(
  action: 'meal_suggestion' | 'auto_shopping' | 'nutrition_info',
  context: { household_id: string; [key: string]: any }
): Promise<AIActionResponse> {
  try {
    console.log('[AIService] Calling AI Smart Action:', action);
    console.log('[AIService] Context:', context);

    // Get the current session to get the access token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('[AIService] No valid session:', sessionError);
      throw new Error('Authentication required. Please sign in again.');
    }

    console.log('[AIService] Session valid, access token present:', !!session.access_token);

    // Get Supabase URL from environment
    const supabaseUrl = 
      Constants.expoConfig?.extra?.supabaseUrl || 
      process.env.EXPO_PUBLIC_SUPABASE_URL || 
      'https://tkavowbmakdnqekweoro.supabase.co';

    // Get anon key from environment
    const supabaseAnonKey = 
      Constants.expoConfig?.extra?.supabaseAnonKey || 
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYXZvd2JtYWtkbnFla3dlb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTMxOTgsImV4cCI6MjA4MDUyOTE5OH0.3tzrUDtmiMRAnyrXUDDnaLo0bUFVQqWJZy8KRRyNy1M';
    
    const functionUrl = `${supabaseUrl}/functions/v1/smart-action`;
    
    console.log('[AIService] Calling Edge Function at:', functionUrl);

    // Prepare request body
    const requestBody: AIActionRequest = {
      action,
      context,
    };

    console.log('[AIService] Request body:', JSON.stringify(requestBody));

    // Call the Edge Function with proper headers
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[AIService] Response status:', response.status);

    // Handle 403 - User is not premium
    if (response.status === 403) {
      console.log('[AIService] 403 Forbidden - User is not premium');
      return {
        success: false,
        result: {},
        error: 'premium_required',
      };
    }

    // Parse response
    const result = await response.json();

    if (!response.ok) {
      console.error('[AIService] Edge Function error:', result);
      throw new Error(result.error || 'AI action failed');
    }

    console.log('[AIService] AI action successful:', result);

    return result as AIActionResponse;
  } catch (error: any) {
    console.error('[AIService] AI action failed:', error);
    throw error;
  }
}

/**
 * Get meal suggestion from AI
 * 
 * @param householdId - The household ID
 * @returns Meal suggestion with nutrition info
 */
export async function getMealSuggestion(householdId: string): Promise<AIActionResponse> {
  return callAISmartAction('meal_suggestion', { household_id: householdId });
}

/**
 * Generate auto shopping list from AI
 * 
 * @param householdId - The household ID
 * @returns Shopping list items
 */
export async function getAutoShoppingList(householdId: string): Promise<AIActionResponse> {
  return callAISmartAction('auto_shopping', { household_id: householdId });
}

/**
 * Get nutrition information from AI
 * 
 * @param householdId - The household ID
 * @param mealName - The meal name to get nutrition info for
 * @returns Nutrition information
 */
export async function getNutritionInfo(
  householdId: string,
  mealName: string
): Promise<AIActionResponse> {
  return callAISmartAction('nutrition_info', {
    household_id: householdId,
    meal_name: mealName,
  });
}
