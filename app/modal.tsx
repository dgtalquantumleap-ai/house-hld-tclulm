
import React, { useState } from 'react';
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
import { useNotifications } from '@/hooks/useNotifications';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function NotificationsModal() {
  const router = useRouter();
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh is handled automatically by the hook
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return { ios: 'checkmark.circle.fill', android: 'check-circle', color: colors.primary };
      case 'event':
        return { ios: 'calendar.circle.fill', android: 'event', color: colors.accent };
      case 'shopping':
        return { ios: 'cart.fill', android: 'shopping-cart', color: colors.secondary };
      case 'poll':
        return { ios: 'chart.bar.fill', android: 'poll', color: colors.primary };
      case 'meal':
        return { ios: 'fork.knife', android: 'restaurant', color: colors.accent };
      case 'invitation':
        return { ios: 'envelope.fill', android: 'mail', color: colors.info };
      default:
        return { ios: 'bell.fill', android: 'notifications', color: colors.textSecondary };
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="xmark"
            android_material_icon_name="close"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadNotifications.length > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New ({unreadNotifications.length})</Text>
            {unreadNotifications.map((notification) => {
              const icon = getNotificationIcon(notification.type);
              return (
                <View key={notification.id} style={[styles.notificationCard, styles.unreadCard]}>
                  <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                    <IconSymbol
                      ios_icon_name={icon.ios}
                      android_material_icon_name={icon.android}
                      size={24}
                      color={icon.color}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsRead(notification.id)}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.success}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(notification.id)}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Read Notifications */}
        {readNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earlier</Text>
            {readNotifications.map((notification) => {
              const icon = getNotificationIcon(notification.type);
              return (
                <View key={notification.id} style={styles.notificationCard}>
                  <View style={[styles.iconContainer, { backgroundColor: `${icon.color}10` }]}>
                    <IconSymbol
                      ios_icon_name={icon.ios}
                      android_material_icon_name={icon.android}
                      size={24}
                      color={icon.color}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, styles.readTitle]}>
                      {notification.title}
                    </Text>
                    <Text style={[styles.notificationMessage, styles.readMessage]}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(notification.id)}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="bell.slash"
              android_material_icon_name="notifications-off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You&apos;re all caught up! 🎉
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  readTitle: {
    fontWeight: '600',
    opacity: 0.7,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  readMessage: {
    opacity: 0.7,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notificationActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
