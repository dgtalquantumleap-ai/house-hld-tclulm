
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';

export default function CalendarScreen() {
  const { user } = useAuth();
  const { events, isLoading, createEvent, deleteEvent, refreshEvents } = useEvents();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshEvents();
    setRefreshing(false);
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date();
      const { error } = await createEvent({
        title: newEventTitle,
        description: newEventDescription || undefined,
        date: today.toISOString().split('T')[0],
        repeat: 'none',
      });

      if (error) {
        Alert.alert('Error', error);
      } else {
        setNewEventTitle('');
        setNewEventDescription('');
        setShowAddModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    const canDelete = user?.role === 'Adult' || user?.role === 'Parent';
    
    if (!canDelete) {
      Alert.alert('Permission Denied', 'Only adults can delete events');
      return;
    }

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteEvent(eventId);
            if (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const getEventColor = (repeat: string) => {
    switch (repeat) {
      case 'daily':
        return colors.secondary;
      case 'weekly':
        return colors.accent;
      case 'monthly':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const canCreateEvent = user?.role === 'Adult' || user?.role === 'Parent';

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
        <Text style={styles.title}>Calendar</Text>
        {canCreateEvent && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={24}
              color={colors.card}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.calendarCard}>
          <Text style={styles.monthTitle}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.calendarGrid}>
            <Text style={styles.calendarPlaceholder}>
              📅 Calendar view coming soon
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {events.length > 0 ? (
            events.map((event) => (
              <TouchableOpacity 
                key={event.id} 
                style={styles.eventCard}
                onLongPress={() => handleDeleteEvent(event.id)}
              >
                <View style={[styles.eventIndicator, { backgroundColor: getEventColor(event.repeat) }]} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                  {event.time && (
                    <Text style={styles.eventTime}>{event.time}</Text>
                  )}
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                </View>
                <View style={styles.eventIcon}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No upcoming events</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Event</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Event title"
              placeholderTextColor={colors.textSecondary}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              autoFocus
              editable={!isSubmitting}
            />
            <TextInput
              style={[commonStyles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newEventDescription}
              onChangeText={setNewEventDescription}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.modalButton]}
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <Text style={buttonStyles.outlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={handleAddEvent}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.card} />
                ) : (
                  <Text style={buttonStyles.text}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  calendarGrid: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  calendarPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  eventIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  eventIcon: {
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
