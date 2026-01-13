
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { IconSymbol } from '@/components/IconSymbol';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { colors } from '@/styles/commonStyles';

export default function MealsScreen() {
  const { user } = useAuth();
  const { settings, isLoading: settingsLoading } = useUserSettings();
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Check if user is premium
  const isPremium = settings?.isPremium || false;

  useEffect(() => { 
    console.log('MealsScreen iOS: Component mounted');
    console.log('MealsScreen iOS: User ID:', user?.id);
    console.log('MealsScreen iOS: Household ID:', user?.householdId);
    console.log('MealsScreen iOS: Is Premium:', isPremium);
    setDebugInfo(`User: ${user?.id?.substring(0, 8)}... | HH: ${user?.householdId?.substring(0, 8)}... | ${isPremium ? 'Premium ✨' : 'Free'}`);
    load(); 
  }, [user?.householdId, isPremium]);

  async function load() {
    try {
      console.log('MealsScreen iOS: Starting load function');
      
      if (!user?.householdId) {
        console.log('MealsScreen iOS: No household ID, skipping load');
        setDebugInfo('No household - join one to see meals');
        return;
      }

      // Check auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('MealsScreen iOS: Session check:', session ? 'exists' : 'null');
      
      if (sessionError) {
        console.error('MealsScreen iOS: Session error:', sessionError);
        setDebugInfo(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error('MealsScreen iOS: No active session');
        setDebugInfo('No session - please log out and back in');
        Alert.alert('Session Error', 'Please log out and log back in to view meals.');
        return;
      }

      const start = getStart(new Date());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      
      console.log('MealsScreen iOS: Loading meals from', startStr, 'to', endStr);
      console.log('MealsScreen iOS: For household:', user.householdId);
      
      setDebugInfo(`Loading ${startStr} to ${endStr}...`);
      
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('household_id', user.householdId)
        .gte('date', startStr)
        .lte('date', endStr);
      
      if (error) {
        console.error('MealsScreen iOS: Error loading meals:', error);
        console.error('MealsScreen iOS: Error code:', error.code);
        console.error('MealsScreen iOS: Error message:', error.message);
        console.error('MealsScreen iOS: Error details:', error.details);
        setDebugInfo(`Error: ${error.message}`);
        Alert.alert('Error Loading Meals', `Failed to load meals: ${error.message}\n\nPlease try logging out and back in.`);
        return;
      }
      
      console.log('MealsScreen iOS: Query successful');
      console.log('MealsScreen iOS: Loaded', data?.length || 0, 'meals');
      
      if (data && data.length > 0) {
        console.log('MealsScreen iOS: First meal:', JSON.stringify(data[0]));
        setDebugInfo(`Loaded ${data.length} meals | ${isPremium ? 'Premium ✨' : 'Free'}`);
      } else {
        console.log('MealsScreen iOS: No meals found for this week');
        setDebugInfo(`No meals for ${startStr} to ${endStr} | ${isPremium ? 'Premium ✨' : 'Free'}`);
      }
      
      setMeals(data || []);
    } catch (e: any) {
      console.error('MealsScreen iOS: Exception loading meals:', e);
      console.error('MealsScreen iOS: Exception message:', e.message);
      console.error('MealsScreen iOS: Exception stack:', e.stack);
      setDebugInfo(`Exception: ${e.message}`);
      Alert.alert('Error', `Failed to load meals: ${e.message}\n\nPlease try restarting the app.`);
    }
  }

  function getStart(d: Date) {
    const n = new Date(d);
    const day = n.getDay();
    // Get Monday of current week
    // If Sunday (0), go back 6 days, otherwise go back (day - 1) days
    n.setDate(n.getDate() - day + (day === 0 ? -6 : 1));
    // Reset time to midnight to avoid timezone issues
    n.setHours(0, 0, 0, 0);
    console.log('MealsScreen iOS: Week start calculated as:', n.toISOString());
    return n;
  }

  async function add(date: Date, type: string) {
    if (!user?.householdId) {
      Alert.alert('Error', 'You must be part of a household to add meals');
      return;
    }

    if (loading) {
      console.log('MealsScreen iOS: Already adding a meal, please wait');
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    console.log('MealsScreen iOS: Add button pressed for', type, 'on', dateStr);

    // Use Alert.prompt for iOS
    Alert.prompt(
      'Add Meal',
      'Enter meal name:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async (name) => {
            if (!name?.trim()) {
              console.log('MealsScreen iOS: No meal name entered');
              return;
            }
            await saveMeal(date, type, name.trim());
          },
        },
      ],
      'plain-text'
    );
  }

  async function saveMeal(date: Date, type: string, name: string) {
    setLoading(true);
    try {
      // Check auth session before saving
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session) {
        console.error('MealsScreen iOS: No active session - cannot save meal');
        Alert.alert('Session Error', 'Please log out and log back in to add meals.');
        setLoading(false);
        return;
      }

      const dateStr = date.toISOString().split('T')[0];
      const mealData = {
        household_id: user!.householdId,
        user_id: user!.id,
        date: dateStr,
        meal_type: type,
        meal_name: name,
      };
      
      console.log('MealsScreen iOS: Inserting meal:', JSON.stringify(mealData));
      
      const { data, error } = await supabase
        .from('meal_plans')
        .insert(mealData)
        .select()
        .single();
      
      if (error) {
        console.error('MealsScreen iOS: Error adding meal:', error);
        console.error('MealsScreen iOS: Error details:', JSON.stringify(error));
        Alert.alert('Error', 'Failed to add meal: ' + error.message);
        return;
      }
      
      console.log('MealsScreen iOS: Meal added successfully:', JSON.stringify(data));
      
      // Optimistically add to UI
      if (data) {
        setMeals(prev => [...prev, data]);
      }
      
      // Reload to ensure sync
      await load();
      
      Alert.alert('Success', `${name} added to ${type}!`);
    } catch (e: any) {
      console.error('MealsScreen iOS: Exception adding meal:', e);
      console.error('MealsScreen iOS: Exception details:', e.message, e.stack);
      Alert.alert('Error', 'Failed to add meal: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMeal(mealId: string, mealName: string) {
    Alert.alert(
      'Delete Meal',
      `Remove "${mealName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('MealsScreen iOS: Deleting meal:', mealId);
              
              const { error } = await supabase
                .from('meal_plans')
                .delete()
                .eq('id', mealId);
              
              if (error) {
                console.error('MealsScreen iOS: Error deleting meal:', error);
                Alert.alert('Error', 'Failed to delete meal');
                return;
              }
              
              console.log('MealsScreen iOS: Meal deleted successfully');
              
              // Remove from UI
              setMeals(prev => prev.filter(m => m.id !== mealId));
            } catch (e) {
              console.error('MealsScreen iOS: Exception deleting meal:', e);
            }
          },
        },
      ]
    );
  }

  // Handle AI meal suggestion button
  const handleAIMealSuggestion = () => {
    if (!isPremium) {
      console.log('[MealsScreen iOS] User is not premium, showing upgrade prompt');
      setShowUpgradePrompt(true);
      return;
    }

    // TODO: Backend Integration - POST /api/ai/meal-suggestion
    // This will be implemented when the backend AI feature is ready
    Alert.alert('AI Feature', 'AI meal suggestions coming soon for premium users!');
  };

  const start = getStart(new Date());
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const types = ['breakfast','lunch','dinner'];
  const icons: { [key: string]: string } = { breakfast: '🌅', lunch: '🌮', dinner: '🍝' };

  if (!user?.householdId) {
    return (
      <View style={[s.c, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
          Join a household to start planning meals
        </Text>
      </View>
    );
  }

  return (
    <View style={s.c}>
      <Text style={s.t}>Weekly Meals</Text>
      <Text style={s.subtitle}>Tap a card to add or change a meal</Text>
      
      {/* AI Meal Suggestion Button - With Premium Gating */}
      <View style={s.aiButtonContainer}>
        <TouchableOpacity 
          style={[s.aiButton, !isPremium && s.aiButtonLocked]}
          onPress={handleAIMealSuggestion}
          disabled={settingsLoading}
          activeOpacity={0.7}
        >
          {!isPremium && (
            <IconSymbol
              ios_icon_name="lock.fill"
              android_material_icon_name="lock"
              size={14}
              color={colors.card}
              style={{ marginRight: 6 }}
            />
          )}
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto-awesome"
            size={16}
            color={colors.card}
            style={{ marginRight: 6 }}
          />
          <Text style={s.aiButtonText}>
            {isPremium ? 'AI Meal Suggestion' : 'Upgrade to Unlock AI'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={s.debugInfo}>{debugInfo}</Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <View style={s.g}>
          {days.map((d, i) => {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            return (
              <View key={i} style={s.col}>
                <Text style={s.d}>{d}</Text>
                <Text style={s.dateText}>{date.getDate()}</Text>
                {types.map((type, typeIndex) => {
                  const m = meals.find(x => 
                    x.date === dateStr && x.meal_type === type
                  );
                  return (
                    <TouchableOpacity 
                      key={typeIndex} 
                      style={[s.card, m && s.f]}
                      onPress={() => {
                        console.log('Card pressed:', type, dateStr);
                        add(date, type);
                      }}
                      onLongPress={() => m && deleteMeal(m.id, m.meal_name)}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Text style={s.i}>{icons[type]}</Text>
                      <Text style={s.n} numberOfLines={2}>
                        {m?.meal_name || 'Add'}
                      </Text>
                      {m && (
                        <Text style={s.hint}>Long press to delete</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="AI Meal Suggestions"
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#fff' },
  t: { fontSize: 24, fontWeight: 'bold', padding: 16, paddingBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', paddingHorizontal: 16, paddingBottom: 8 },
  aiButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    boxShadow: '0px 2px 6px rgba(99, 102, 241, 0.3)',
    elevation: 3,
  },
  aiButtonLocked: {
    backgroundColor: colors.textSecondary,
  },
  aiButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
  debugInfo: { 
    fontSize: 11, 
    color: '#999', 
    paddingHorizontal: 16, 
    paddingBottom: 12, 
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  g: { flexDirection: 'row', padding: 8 },
  col: { width: 100, marginRight: 8 },
  d: { fontWeight: 'bold', textAlign: 'center', marginBottom: 2, fontSize: 14 },
  dateText: { textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 8 },
  card: { 
    backgroundColor: '#f5f5f5', 
    padding: 10, 
    marginBottom: 8, 
    borderRadius: 8, 
    minHeight: 70,
    justifyContent: 'center',
  },
  f: { backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#2196F3' },
  i: { fontSize: 20, textAlign: 'center' },
  n: { fontSize: 12, textAlign: 'center', marginTop: 4, fontWeight: '500' },
  hint: { fontSize: 9, textAlign: 'center', color: '#999', marginTop: 2 },
});
