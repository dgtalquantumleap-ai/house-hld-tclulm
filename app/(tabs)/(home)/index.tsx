
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useShoppingList } from '@/hooks/useShoppingList';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tasks, isLoading: tasksLoading, refreshTasks } = useTasks();
  const { events, isLoading: eventsLoading, refreshEvents } = useEvents();
  const { items, isLoading: itemsLoading, refreshItems } = useShoppingList();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshTasks(), refreshEvents(), refreshItems()]);
    setRefreshing(false);
  };

  // Filter today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow && task.status !== 'completed';
  }).slice(0, 3);

  // Get upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= today)
    .slice(0, 3);

  // Get needed shopping items
  const neededItems = items.filter(item => !item.purchased).slice(0, 3);

  const isLoading = tasksLoading || eventsLoading || itemsLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
            <TouchableOpacity 
              key={task.id} 
              style={styles.card}
              onPress={() => router.push('/(tabs)/tasks')}
            >
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
                  {task.frequency} • {task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time set'}
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

        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <TouchableOpacity 
              key={event.id} 
              style={styles.card}
              onPress={() => router.push('/(tabs)/calendar')}
            >
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
                  {new Date(event.date).toLocaleDateString()} • {event.time || 'All day'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shopping List</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/shopping')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {neededItems.length > 0 ? (
          neededItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => router.push('/(tabs)/shopping')}
            >
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
                <Text style={styles.cardSubtitle}>
                  {item.quantity || ''} {item.category ? `• ${item.category}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Shopping list is empty</Text>
          </View>
        )}
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
