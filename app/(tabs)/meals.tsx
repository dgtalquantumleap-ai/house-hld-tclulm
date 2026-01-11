
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MealsScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const start = getStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const { data } = await supabase.from('meal_plans').select('*')
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]);
    setMeals(data || []);
  }

  function getStart(d: Date) {
    const n = new Date(d);
    const day = n.getDay();
    n.setDate(n.getDate() - day + (day === 0 ? -6 : 1));
    return n;
  }

  async function add(date: Date, type: string) {
    Alert.prompt('Meal', 'Name:', async (name) => {
      if (!name) return;
      await supabase.from('meal_plans').insert({
        date: date.toISOString().split('T')[0],
        meal_type: type,
        meal_name: name,
        user_id: user?.id,
      });
      load();
    });
  }

  const start = getStart(new Date());
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const types = ['breakfast','lunch','dinner'];
  const icons: { [key: string]: string } = { breakfast: '🌅', lunch: '🌮', dinner: '🍝' };

  return (
    <ScrollView style={s.c}>
      <Text style={s.t}>Weekly Meals</Text>
      <ScrollView horizontal>
        <View style={s.g}>
          {days.map((d, i) => {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            return (
              <View key={d} style={s.col}>
                <Text style={s.d}>{d}</Text>
                {types.map(type => {
                  const m = meals.find(x => 
                    x.date === date.toISOString().split('T')[0] && x.meal_type === type
                  );
                  return (
                    <TouchableOpacity key={type} style={[s.card, m && s.f]}
                      onPress={() => add(date, type)}>
                      <Text style={s.i}>{icons[type]}</Text>
                      <Text style={s.n}>{m?.meal_name || 'Add'}</Text>
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
  t: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  g: { flexDirection: 'row', padding: 8 },
  col: { width: 110, marginRight: 8 },
  d: { fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  card: { backgroundColor: '#f5f5f5', padding: 10, marginBottom: 8, borderRadius: 8, minHeight: 70 },
  f: { backgroundColor: '#e3f2fd' },
  i: { fontSize: 20, textAlign: 'center' },
  n: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
