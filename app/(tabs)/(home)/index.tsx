
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const todaysTasks = [
    { id: '1', title: 'Take out trash', assignedTo: 'You', dueTime: '10:00 AM' },
    { id: '2', title: 'Vacuum living room', assignedTo: 'Sarah', dueTime: '2:00 PM' },
    { id: '3', title: 'Water plants', assignedTo: 'You', dueTime: '5:00 PM' },
  ];

  const upcomingEvents = [
    { id: '1', title: 'Garbage Day', date: 'Tomorrow', time: '7:00 AM' },
    { id: '2', title: 'Family Dinner', date: 'Friday', time: '6:30 PM' },
  ];

  const shoppingItems = [
    { id: '1', name: 'Milk', category: 'Dairy' },
    { id: '2', name: 'Bread', category: 'Bakery' },
    { id: '3', name: 'Eggs', category: 'Dairy' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'there'}! 👋</Text>
          <Text style={styles.subtitle}>Here&apos;s what&apos;s happening today</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {todaysTasks.length > 0 ? (
          todaysTasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <IconSymbol
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check_circle"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{task.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {task.assignedTo} • {task.dueTime}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks for today! 🎉</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcomingEvents.map((event) => (
          <TouchableOpacity key={event.id} style={styles.card}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar_today"
                size={24}
                color={colors.accent}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.cardSubtitle}>
                {event.date} • {event.time}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shopping List</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/shopping')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {shoppingItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="cart"
                android_material_icon_name="shopping_cart"
                size={24}
                color={colors.secondary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.category}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  cardIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
