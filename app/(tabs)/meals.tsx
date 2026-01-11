
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MealsScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    console.log('MealsScreen: Loading meals for user:', user?.id, 'household:', user?.householdId);
    load(); 
  }, [user?.householdId]);

  async function load() {
    try {
      if (!user?.householdId) {
        console.log('MealsScreen: No household ID, skipping load');
        return;
      }

      const start = getStart(new Date());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      console.log('MealsScreen: Loading meals from', start.toISOString().split('T')[0], 'to', end.toISOString().split('T')[0]);
      
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('household_id', user.householdId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);
      
      if (error) {
        console.error('MealsScreen: Error loading meals:', error);
        return;
      }
      
      console.log('MealsScreen: Loaded meals:', data?.length || 0, 'meals');
      setMeals(data || []);
    } catch (e) {
      console.error('MealsScreen: Exception loading meals:', e);
    }
  }

  function getStart(d: Date) {
    const n = new Date(d);
    const day = n.getDay();
    n.setDate(n.getDate() - day + (day === 0 ? -6 : 1));
    return n;
  }

  async function add(date: Date, type: string) {
    if (!user?.householdId) {
      Alert.alert('Error', 'You must be part of a household to add meals');
      return;
    }

    if (loading) {
      console.log('MealsScreen: Already adding a meal, please wait');
      return;
    }

    // Use Alert.prompt for iOS, Alert with input for Android
    if (Platform.OS === 'ios') {
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
                console.log('MealsScreen: No meal name entered');
                return;
              }
              await saveMeal(date, type, name.trim());
            },
          },
        ],
        'plain-text'
      );
    } else {
      // For Android, use a simple alert with a workaround
      // In a production app, you'd want to use a proper modal/dialog component
      Alert.alert(
        'Add Meal',
        'What would you like to eat?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Eggs', 
            onPress: () => saveMeal(date, type, 'Eggs')
          },
          { 
            text: 'Pasta', 
            onPress: () => saveMeal(date, type, 'Pasta')
          },
          { 
            text: 'Salad', 
            onPress: () => saveMeal(date, type, 'Salad')
          },
        ],
        { cancelable: true }
      );
    }
  }

  async function saveMeal(date: Date, type: string, name: string) {
    setLoading(true);
    try {
      const mealData = {
        household_id: user!.householdId,
        user_id: user!.id,
        date: date.toISOString().split('T')[0],
        meal_type: type,
        meal_name: name,
      };
      
      console.log('MealsScreen: Inserting meal:', mealData);
      
      const { data, error } = await supabase
        .from('meal_plans')
        .insert(mealData)
        .select()
        .single();
      
      if (error) {
        console.error('MealsScreen: Error adding meal:', error);
        Alert.alert('Error', 'Failed to add meal: ' + error.message);
        return;
      }
      
      console.log('MealsScreen: Meal added successfully:', data);
      
      // Optimistically add to UI
      if (data) {
        setMeals(prev => [...prev, data]);
      }
      
      // Reload to ensure sync
      await load();
      
      Alert.alert('Success', `${name} added to ${type}!`);
    } catch (e: any) {
      console.error('MealsScreen: Exception adding meal:', e);
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
              console.log('MealsScreen: Deleting meal:', mealId);
              
              const { error } = await supabase
                .from('meal_plans')
                .delete()
                .eq('id', mealId);
              
              if (error) {
                console.error('MealsScreen: Error deleting meal:', error);
                Alert.alert('Error', 'Failed to delete meal');
                return;
              }
              
              console.log('MealsScreen: Meal deleted successfully');
              
              // Remove from UI
              setMeals(prev => prev.filter(m => m.id !== mealId));
            } catch (e) {
              console.error('MealsScreen: Exception deleting meal:', e);
            }
          },
        },
      ]
    );
  }

  const start = getStart(new Date());
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const types = ['breakfast','lunch','dinner'];
  const icons: { [key: string]: string } = { breakfast: '🌅', lunch: '🌮', dinner: '🍝' };

  if (!user?.householdId) {
    return (
      <View style={[s.c, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#666' }}>
          Join a household to start planning meals
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.c}>
      <Text style={s.t}>Weekly Meals</Text>
      <Text style={s.subtitle}>Tap a card to add or change a meal</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                      onPress={() => add(date, type)}
                      onLongPress={() => m && deleteMeal(m.id, m.meal_name)}
                      disabled={loading}
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
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#fff' },
  t: { fontSize: 24, fontWeight: 'bold', padding: 16, paddingBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', paddingHorizontal: 16, paddingBottom: 12 },
  g: { flexDirection: 'row', padding: 8 },
  col: { width: 110, marginRight: 8 },
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
