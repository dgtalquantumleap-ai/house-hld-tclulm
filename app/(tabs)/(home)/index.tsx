
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useMeals } from '@/hooks/useMeals';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserSettings } from '@/hooks/useUserSettings';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { getMealSuggestion } from '@/utils/aiService';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tasks, isLoading: tasksLoading, refreshTasks } = useTasks();
  const { events, isLoading: eventsLoading, refreshEvents } = useEvents();
  const { items, isLoading: itemsLoading, refreshItems } = useShoppingList();
  const { meals, isLoading: mealsLoading, refreshMeals } = useMeals();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { settings, isLoading: settingsLoading } = useUserSettings();

  const [refreshing, setRefreshing] = React.useState(false);
  const [showAISuggestion, setShowAISuggestion] = React.useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);
  const [aiSuggestionLoading, setAiSuggestionLoading] = React.useState(false);
  const [aiMealSuggestion, setAiMealSuggestion] = React.useState<string | null>(null);

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

  const isLoading = tasksLoading || eventsLoading || itemsLoading || mealsLoading || settingsLoading;

  const handleQuickConfirm = async (notificationId: string, action: 'acknowledged' | 'done') => {
    await markAsRead(notificationId);
  };

  // Get next event for calendar strip
  const nextEvent = upcomingEvents[0];
  const nextEventTime = nextEvent ? new Date(nextEvent.date) : null;
  const hoursUntilEvent = nextEventTime 
    ? Math.round((nextEventTime.getTime() - new Date().getTime()) / (1000 * 60 * 60))
    : null;

  // Check if user is premium
  const isPremium = settings?.isPremium || false;

  // Handle AI meal suggestion
  const handleAIMealSuggestion = async () => {
    if (!user?.householdId) {
      Alert.alert('Error', 'You must be part of a household to use AI features');
      return;
    }

    // Check if user is premium
    if (!isPremium) {
      console.log('[HomeScreen] User is not premium, showing upgrade prompt');
      setShowUpgradePrompt(true);
      return;
    }

    setAiSuggestionLoading(true);
    try {
      console.log('[HomeScreen] Requesting AI meal suggestion');
      const response = await getMealSuggestion(user.householdId);

      if (response.error === 'premium_required') {
        console.log('[HomeScreen] Backend returned 403 - premium required');
        setShowUpgradePrompt(true);
        return;
      }

      if (response.success && response.result.meal) {
        console.log('[HomeScreen] AI meal suggestion received:', response.result.meal);
        setAiMealSuggestion(response.result.meal);
        
        // Show nutrition info if available
        if (response.result.calories) {
          Alert.alert(
            'AI Meal Suggestion',
            `${response.result.meal}\n\nCalories: ${response.result.calories}${
              response.result.protein ? `\nProtein: ${response.result.protein}g` : ''
            }${response.result.carbs ? `\nCarbs: ${response.result.carbs}g` : ''}${
              response.result.fat ? `\nFat: ${response.result.fat}g` : ''
            }`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('AI Meal Suggestion', response.result.meal, [{ text: 'OK' }]);
        }
      } else {
        Alert.alert('Error', 'Failed to get meal suggestion. Please try again.');
      }
    } catch (error: any) {
      console.error('[HomeScreen] AI meal suggestion error:', error);
      Alert.alert('Error', error.message || 'Failed to get meal suggestion');
    } finally {
      setAiSuggestionLoading(false);
    }
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
            activeOpacity={0.7}
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

      {/* Calendar Strip - Visual Only */}
      <View style={styles.calendarStrip}>
        <View style={styles.calendarStripLeft}>
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="event"
            size={24}
            color={colors.primary}
          />
          <View style={styles.calendarStripText}>
            <Text style={styles.calendarStripDate}>
              {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
            {nextEvent ? (
              <Text style={styles.calendarStripNext}>
                Next: {nextEvent.title} {hoursUntilEvent !== null && hoursUntilEvent < 24 ? `in ${hoursUntilEvent}h` : ''}
              </Text>
            ) : (
              <Text style={styles.calendarStripNext}>No upcoming events</Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.syncButton, !isPremium && styles.syncButtonDisabled]}
          onPress={() => {
            if (!isPremium) {
              setShowUpgradePrompt(true);
            } else {
              router.push('/(tabs)/calendar');
            }
          }}
          activeOpacity={0.7}
        >
          {!isPremium && (
            <IconSymbol
              ios_icon_name="lock.fill"
              android_material_icon_name="lock"
              size={12}
              color={colors.card}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={styles.syncButtonText}>
            {isPremium ? 'View Calendar' : 'Sync Calendar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity 
          style={styles.statCard} 
          onPress={() => router.push('/(tabs)/tasks')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check-circle"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.statNumber}>{todaysTasks.length}</Text>
          <Text style={styles.statLabel}>Tasks Today</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCard} 
          onPress={() => router.push('/(tabs)/calendar')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="calendar.circle.fill"
            android_material_icon_name="event"
            size={32}
            color={colors.accent}
          />
          <Text style={styles.statNumber}>{upcomingEvents.length}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCard} 
          onPress={() => router.push('/(tabs)/shopping')}
          activeOpacity={0.7}
        >
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

      {/* AI Smart Suggestions - With Premium Gating */}
      {showAISuggestion && (
        <View style={[styles.aiSuggestionCard, !isPremium && styles.aiSuggestionCardLocked]}>
          <View style={styles.aiSuggestionHeader}>
            <View style={styles.aiSuggestionTitle}>
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto-awesome"
                size={20}
                color={isPremium ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.aiSuggestionTitleText, !isPremium && styles.aiSuggestionTitleTextLocked]}>
                AI Smart Suggestion
              </Text>
              {!isPremium && (
                <View style={styles.premiumBadge}>
                  <IconSymbol
                    ios_icon_name="lock.fill"
                    android_material_icon_name="lock"
                    size={12}
                    color={colors.card}
                  />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              onPress={() => setShowAISuggestion(false)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.aiSuggestionText, !isPremium && styles.aiSuggestionTextLocked]}>
            {isPremium 
              ? (aiMealSuggestion || 'Get AI-powered meal suggestions based on your household preferences.')
              : 'Upgrade to premium to get AI-powered meal suggestions and smart automation.'}
          </Text>
          <TouchableOpacity 
            style={[styles.aiSuggestionButton, !isPremium && styles.aiSuggestionButtonLocked]}
            onPress={handleAIMealSuggestion}
            disabled={aiSuggestionLoading}
            activeOpacity={0.7}
          >
            {aiSuggestionLoading ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <React.Fragment>
                {!isPremium && (
                  <IconSymbol
                    ios_icon_name="lock.fill"
                    android_material_icon_name="lock"
                    size={14}
                    color={colors.card}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={styles.aiSuggestionButtonText}>
                  {isPremium ? 'Get Meal Suggestion' : 'Upgrade to Unlock'}
                </Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Notifications */}
      {recentNotifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Confirm</Text>
            <TouchableOpacity onPress={() => router.push('/modal')} activeOpacity={0.7}>
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
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.doneButton]}
                  onPress={() => handleQuickConfirm(notification.id, 'done')}
                  activeOpacity={0.7}
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
            <TouchableOpacity 
              key={meal.id} 
              style={styles.card}
              onPress={() => router.push('/(tabs)/meals')}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Today's Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {todaysTasks.length > 0 ? (
          todaysTasks.map((task) => (
            <TouchableOpacity 
              key={task.id} 
              style={styles.card}
              onPress={() => router.push('/(tabs)/tasks')}
              activeOpacity={0.7}
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
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No tasks for today! 🎉</Text>
            <Text style={styles.emptySubtext}>You&apos;re all caught up</Text>
          </View>
        )}
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <TouchableOpacity 
              key={event.id} 
              style={styles.card}
              onPress={() => router.push('/(tabs)/calendar')}
              activeOpacity={0.7}
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
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No upcoming events</Text>
            <Text style={styles.emptySubtext}>Tap + to add or sync your calendar</Text>
            <TouchableOpacity 
              style={styles.emptyActionLink}
              onPress={() => router.push('/(tabs)/calendar')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyActionText}>Add Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Shopping List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shopping List</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/shopping')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {neededItems.length > 0 ? (
          neededItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => router.push('/(tabs)/shopping')}
              activeOpacity={0.7}
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
            <IconSymbol
              ios_icon_name="cart"
              android_material_icon_name="shopping-cart"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Shopping list is empty</Text>
            <Text style={styles.emptySubtext}>Add items you need to buy</Text>
            <TouchableOpacity 
              style={styles.emptyActionLink}
              onPress={() => router.push('/(tabs)/shopping')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyActionText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="AI Smart Features"
      />
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
    marginBottom: 20,
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
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  calendarStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  calendarStripText: {
    flex: 1,
  },
  calendarStripDate: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  calendarStripNext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  syncButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  syncButtonText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
  aiSuggestionCard: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  aiSuggestionCardLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: colors.textSecondary,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSuggestionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiSuggestionTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  aiSuggestionTitleTextLocked: {
    color: colors.textSecondary,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.card,
  },
  aiSuggestionText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  aiSuggestionTextLocked: {
    color: colors.textSecondary,
  },
  aiSuggestionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSuggestionButtonLocked: {
    backgroundColor: colors.textSecondary,
  },
  aiSuggestionButtonText: {
    color: colors.card,
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    opacity: 0.7,
  },
  emptyActionLink: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
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
