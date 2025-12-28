
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
  Platform,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CalendarScreen() {
  const { user } = useAuth();
  const { events, isLoading, createEvent, updateEvent, deleteEvent, refreshEvents } = useEvents();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictEvent, setConflictEvent] = useState<any>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date());
  const [newEventTime, setNewEventTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshEvents();
    setRefreshing(false);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewEventDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setNewEventTime(selectedTime);
    }
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-US');
  
  const formatTime = (t: Date) => t.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        title: newEventTitle,
        description: newEventDescription || undefined,
        date: newEventDate.toISOString().split('T')[0], // YYYY-MM-DD
        time: newEventTime.toTimeString().substring(0, 5), // HH:MM
        repeat: 'none',
        confirmationStatus: 'pending',
      };

      const { error } = await createEvent(eventData);

      if (error) {
        Alert.alert('Error', error);
      } else {
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventDate(new Date());
        setNewEventTime(new Date());
        setShowAddModal(false);
        Alert.alert('Success', 'Event created! Other household members will be notified.');
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

  const handleConflictResolution = (event: any) => {
    setConflictEvent(event);
    setShowConflictModal(true);
  };

  const resolveConflict = async (action: 'keep_mine' | 'keep_partner' | 'merge') => {
    if (!conflictEvent) return;

    try {
      if (action === 'keep_mine') {
        // Keep current user's version
        await updateEvent(conflictEvent.id, {
          confirmationStatus: 'confirmed',
        });
        Alert.alert('Success', 'Your version has been kept');
      } else if (action === 'keep_partner') {
        // Accept partner's version
        await updateEvent(conflictEvent.id, {
          confirmationStatus: 'confirmed',
        });
        Alert.alert('Success', 'Partner\'s version has been accepted');
      } else if (action === 'merge') {
        // Merge both versions (create a new event with combined info)
        Alert.alert('Info', 'Merge functionality will combine both event details');
      }
      
      setShowConflictModal(false);
      setConflictEvent(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleConfirmEvent = async (eventId: string, status: 'confirmed' | 'declined') => {
    const { error } = await updateEvent(eventId, {
      confirmationStatus: status,
    });

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', `Event ${status}`);
    }
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

  const getConfirmationColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'declined':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const canCreateEvent = user?.role === 'Adult' || user?.role === 'Parent';

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

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
        <View style={styles.headerActions}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'daily' && styles.viewButtonActive]}
              onPress={() => setViewMode('daily')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'daily' && styles.viewButtonTextActive]}>
                Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'weekly' && styles.viewButtonActive]}
              onPress={() => setViewMode('weekly')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'weekly' && styles.viewButtonTextActive]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'monthly' && styles.viewButtonActive]}
              onPress={() => setViewMode('monthly')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'monthly' && styles.viewButtonTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>
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
              📅 {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {Object.keys(groupedEvents).length > 0 ? (
            Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <View key={date} style={styles.dateSection}>
                <Text style={styles.dateHeader}>{date}</Text>
                {dateEvents.map((event) => (
                  <TouchableOpacity 
                    key={event.id} 
                    style={styles.eventCard}
                    onLongPress={() => handleDeleteEvent(event.id)}
                  >
                    <View style={[styles.eventIndicator, { backgroundColor: getEventColor(event.repeat) }]} />
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        {event.confirmationStatus && (
                          <View style={[styles.statusBadge, { backgroundColor: getConfirmationColor(event.confirmationStatus) }]}>
                            <Text style={styles.statusBadgeText}>
                              {event.confirmationStatus}
                            </Text>
                          </View>
                        )}
                      </View>
                      {event.time && (
                        <Text style={styles.eventTime}>🕐 {event.time}</Text>
                      )}
                      {event.description && (
                        <Text style={styles.eventDescription}>{event.description}</Text>
                      )}
                      {event.calendarSource && (
                        <Text style={styles.eventSource}>
                          📱 From {event.calendarSource}
                        </Text>
                      )}
                      
                      {/* Confirmation Actions */}
                      {event.confirmationStatus === 'pending' && event.createdByUserId !== user?.id && (
                        <View style={styles.confirmationActions}>
                          <TouchableOpacity
                            style={[styles.confirmButton, styles.confirmButtonAccept]}
                            onPress={() => handleConfirmEvent(event.id, 'confirmed')}
                          >
                            <Text style={styles.confirmButtonText}>✓ Confirm</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.confirmButton, styles.confirmButtonDecline]}
                            onPress={() => handleConfirmEvent(event.id, 'declined')}
                          >
                            <Text style={styles.confirmButtonText}>✗ Decline</Text>
                          </TouchableOpacity>
                        </View>
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
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No upcoming events</Text>
              <Text style={styles.emptySubtext}>Add an event to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Event</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="e.g., Family Dinner"
              placeholderTextColor={colors.textSecondary}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              autoFocus
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[commonStyles.input, styles.textArea]}
              placeholder="Add details..."
              placeholderTextColor={colors.textSecondary}
              value={newEventDescription}
              onChangeText={setNewEventDescription}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(newEventDate)}
              </Text>
              <IconSymbol
                ios_icon_name="calendar.circle"
                android_material_icon_name="event"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={newEventDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Time (Optional)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatTime(newEventTime)}
              </Text>
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="schedule"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={newEventTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            <TouchableOpacity
              style={[buttonStyles.primary, styles.createButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleAddEvent}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={buttonStyles.text}>Add Event</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Conflict Resolution Modal */}
      <Modal
        visible={showConflictModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.conflictOverlay}>
          <View style={styles.conflictContent}>
            <Text style={styles.conflictTitle}>Event Conflict Detected</Text>
            <Text style={styles.conflictMessage}>
              This event has conflicting versions. How would you like to resolve it?
            </Text>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.conflictButton]}
              onPress={() => resolveConflict('keep_mine')}
            >
              <Text style={buttonStyles.text}>Keep My Version</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.secondary, styles.conflictButton]}
              onPress={() => resolveConflict('keep_partner')}
            >
              <Text style={[buttonStyles.text, { color: colors.primary }]}>
                Keep Partner&apos;s Version
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.outline, styles.conflictButton]}
              onPress={() => resolveConflict('merge')}
            >
              <Text style={buttonStyles.outlineText}>Merge Both</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.conflictCancelButton}
              onPress={() => setShowConflictModal(false)}
            >
              <Text style={styles.conflictCancelText}>Cancel</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewButtonTextActive: {
    color: colors.card,
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
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.card,
    textTransform: 'capitalize',
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
  eventSource: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonAccept: {
    backgroundColor: colors.success,
  },
  confirmButtonDecline: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.card,
  },
  eventIcon: {
    justifyContent: 'center',
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cancelText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  createButton: {
    marginTop: 24,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  conflictOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  conflictContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  conflictTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  conflictMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  conflictButton: {
    marginBottom: 12,
  },
  conflictCancelButton: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
  conflictCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
