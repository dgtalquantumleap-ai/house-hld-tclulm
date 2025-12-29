
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
  KeyboardAvoidingView,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/contexts/RealtimeProvider';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CalendarScreen() {
  const { user } = useAuth();
  const { events } = useRealtimeData();
  const { createEvent, updateEvent, deleteEvent, refreshEvents } = useEvents();
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
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
        // Refresh events list
        await refreshEvents();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    console.log('handleDeleteEvent called with:', eventId, eventTitle);
    
    const canDelete = user?.role === 'Adult' || user?.role === 'Parent';
    
    if (!canDelete) {
      Alert.alert('Permission Denied', 'Only adults can delete events');
      return;
    }

    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed deletion, deleting event:', eventId);
            const { error } = await deleteEvent(eventId);
            if (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', error);
            } else {
              console.log('Event deleted successfully, refreshing list');
              // Force immediate refresh
              await refreshEvents();
              Alert.alert('Success', 'Event deleted successfully');
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
      await refreshEvents();
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
      await refreshEvents();
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
  const canDeleteEvent = user?.role === 'Adult' || user?.role === 'Parent';

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  // Calendar generation functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getEventsForDate = (day: number) => {
    const dateStr = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    ).toLocaleDateString();
    return groupedEvents[dateStr] || [];
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    console.log('Date clicked:', day);
    const clickedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(clickedDate);
    setNewEventDate(clickedDate);
    
    // Show events for this date or open add modal
    const dayEvents = getEventsForDate(day);
    console.log('Events for this date:', dayEvents.length);
    
    if (dayEvents.length === 0 && canCreateEvent) {
      setShowAddModal(true);
    } else {
      // Scroll to the events section for this date
      Alert.alert(
        'Events',
        dayEvents.length > 0 
          ? `${dayEvents.length} event(s) on this date. Scroll down to view.`
          : 'No events on this date. Would you like to add one?',
        dayEvents.length === 0 && canCreateEvent
          ? [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Event', onPress: () => setShowAddModal(true) }
            ]
          : [{ text: 'OK' }]
      );
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <View style={styles.headerActions}>
          {canCreateEvent && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
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
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={previousMonth} style={styles.monthButton} activeOpacity={0.7}>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="chevron_left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthButton} activeOpacity={0.7}>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={styles.weekDaysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Text key={index} style={styles.weekDayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const hasEvents = dayEvents.length > 0;
              const isTodayDate = day ? isToday(day) : false;

              return (
                <View key={index} style={styles.calendarDay}>
                  {day ? (
                    <TouchableOpacity
                      style={[
                        styles.dayContent,
                        isTodayDate && styles.todayContent
                      ]}
                      onPress={() => handleDateClick(day)}
                      activeOpacity={0.6}
                    >
                      <Text style={[
                        styles.dayNumber,
                        isTodayDate && styles.todayNumber
                      ]}>
                        {day}
                      </Text>
                      {hasEvents && (
                        <View style={styles.eventDots}>
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.eventDot,
                                { backgroundColor: getEventColor(event.repeat) }
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.emptyDay} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Upcoming Events List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {Object.keys(groupedEvents).length > 0 ? (
            Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <View key={date} style={styles.dateSection}>
                <Text style={styles.dateHeader}>{date}</Text>
                {dateEvents.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
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
                            activeOpacity={0.7}
                          >
                            <Text style={styles.confirmButtonText}>✓ Confirm</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.confirmButton, styles.confirmButtonDecline]}
                            onPress={() => handleConfirmEvent(event.id, 'declined')}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.confirmButtonText}>✗ Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Delete Button */}
                      {canDeleteEvent && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => {
                            console.log('Delete button pressed for event:', event.id);
                            handleDeleteEvent(event.id, event.title);
                          }}
                          activeOpacity={0.6}
                        >
                          <IconSymbol
                            ios_icon_name="trash"
                            android_material_icon_name="delete"
                            size={20}
                            color={colors.error}
                          />
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No upcoming events</Text>
              <Text style={styles.emptySubtext}>Tap + to schedule an event</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal - IMPROVED WITH BACKDROP DISMISS */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>Add Event</Text>

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
                  activeOpacity={0.7}
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
                  activeOpacity={0.7}
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
                      <Text style={buttonStyles.text}>Add Event</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
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
              activeOpacity={0.7}
            >
              <Text style={buttonStyles.text}>Keep My Version</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.secondary, styles.conflictButton]}
              onPress={() => resolveConflict('keep_partner')}
              activeOpacity={0.7}
            >
              <Text style={[buttonStyles.text, { color: colors.primary }]}>
                Keep Partner&apos;s Version
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.outline, styles.conflictButton]}
              onPress={() => resolveConflict('merge')}
              activeOpacity={0.7}
            >
              <Text style={buttonStyles.outlineText}>Merge Both</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.conflictCancelButton}
              onPress={() => setShowConflictModal(false)}
              activeOpacity={0.7}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    padding: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 40,
  },
  todayContent: {
    backgroundColor: colors.primary,
  },
  emptyDay: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  todayNumber: {
    color: colors.card,
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.error,
    minHeight: 44,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
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
    minHeight: 56,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
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
