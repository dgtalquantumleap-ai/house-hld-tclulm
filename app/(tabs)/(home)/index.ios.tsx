
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
import { useMeals } from '@/hooks/useMeals';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tasks, isLoading: tasksLoading, refreshTasks } = useTasks();
  const { events, isLoading: eventsLoading, refreshEvents } = useEvents();
  const { items, isLoading: itemsLoading, refreshItems } = useShoppingList();
  const { meals, isLoading: mealsLoading, refreshMeals } = useMeals();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshTasks(), refreshEvents(), refreshItems(), refreshMeals()]);
    setRefreshing(false);
  };

  // Filter today's data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow && task.status !== 'completed';
  }).slice(0, 3);

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= today)
    .slice(0, 3);

  const todaysMeals = meals
    .filter(meal => {
      const mealDate = new Date(meal.mealDate);
      return mealDate >= today && mealDate < tomorrow;
    })
    .slice(0, 2);

  const neededItems = items.filter(item => !item.purchased).slice(0, 3);

  const recentNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 3);

  const isLoading = tasksLoading || eventsLoading || itemsLoading || mealsLoading;

  const handleQuickConfirm = async (notificationId: string, action: 'acknowledged' | 'done') => {
    await markAsRead(notificationId);
    // Additional logic for specific actions can be added here
  };

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
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.notificationBadge}
            onPress={() => router.push('/modal')}
          >
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={24}
              color={colors.card}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/tasks')}>
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check-circle"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.statNumber}>{todaysTasks.length}</Text>
          <Text style={styles.statLabel}>Tasks Today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/calendar')}>
          <IconSymbol
            ios_icon_name="calendar.circle.fill"
            android_material_icon_name="event"
            size={32}
            color={colors.accent}
          />
          <Text style={styles.statNumber}>{upcomingEvents.length}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/shopping')}>
          <IconSymbol
            ios_icon_name="cart.fill"
            android_material_icon_name="shopping-cart"
            size={32}
            color={colors.secondary}
          />
          <Text style={styles.statNumber}>{neededItems.length}</Text>
          <Text style={styles.statLabel}>To Buy</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Notifications */}
      {recentNotifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Confirm</Text>
            <TouchableOpacity onPress={() => router.push('/modal')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentNotifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </View>
              <View style={styles.notificationActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acknowledgeButton]}
                  onPress={() => handleQuickConfirm(notification.id, 'acknowledged')}
                >
                  <Text style={styles.actionButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.doneButton]}
                  onPress={() => handleQuickConfirm(notification.id, 'done')}
                >
                  <Text style={styles.actionButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Today's Meals */}
      {todaysMeals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
          </View>

          {todaysMeals.map((meal) => (
            <View key={meal.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={24}
                  color={colors.accent}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{meal.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {meal.mealTime || 'No time set'} {meal.assignedToUserId ? '• Assigned' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Today's Tasks */}
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
                  android_material_icon_name="check-circle"
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

      {/* Upcoming Events */}
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
                  android_material_icon_name="event"
                  size={24}
                  color={colors.accent}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {new Date(event.date).toLocaleDateString()} • {event.time || 'All day'}
                </Text>
                {event.confirmationStatus && (
                  <Text style={[
                    styles.statusBadge,
                    event.confirmationStatus === 'confirmed' && styles.confirmedBadge,
                    event.confirmationStatus === 'pending' && styles.pendingBadge,
                  ]}>
                    {event.confirmationStatus}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        )}
      </View>

      {/* Shopping List */}
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
                  android_material_icon_name="shopping-cart"
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
  notificationBadge: {
    position: 'relative',
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 12,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
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
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  confirmedBadge: {
    color: colors.success,
  },
  pendingBadge: {
    color: colors.warning,
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
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acknowledgeButton: {
    backgroundColor: colors.success,
  },
  doneButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
});
