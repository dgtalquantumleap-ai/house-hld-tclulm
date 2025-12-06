
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateUser } = useAuth();
  const { household, isLoading: householdLoading, refreshHousehold } = useHousehold();
  const { notifications, isLoading: notificationsLoading, markAllAsRead, getUnreadCount, refreshNotifications } = useNotifications();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [householdMembers, setHouseholdMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const unreadCount = getUnreadCount();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshHousehold(), refreshNotifications()]);
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUser({
        name: editName,
        phone: editPhone || undefined,
      });
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household',
      'Are you sure you want to leave this household? You will need an invite code to rejoin.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateUser({ householdId: null });
              Alert.alert('Success', 'You have left the household', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(auth)/onboarding'),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave household');
            }
          },
        },
      ]
    );
  };

  const handleShareInviteCode = async () => {
    if (!household?.inviteCode) {
      Alert.alert('Error', 'No invite code available');
      return;
    }

    try {
      await Share.share({
        message: `Join our household "${household.name}" on HouseHLD! Use invite code: ${household.inviteCode}`,
      });
    } catch (error: any) {
      console.error('Error sharing invite code:', error);
    }
  };

  const loadHouseholdMembers = async () => {
    if (!user?.householdId) return;

    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('household_id', user.householdId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHouseholdMembers(data || []);
    } catch (error: any) {
      console.error('Error loading household members:', error);
      Alert.alert('Error', 'Failed to load household members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleViewMembers = () => {
    loadHouseholdMembers();
    setShowMembersModal(true);
  };

  const handleMarkAllNotificationsRead = async () => {
    const { error } = await markAllAsRead();
    if (error) {
      Alert.alert('Error', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotificationsModal(true)}
        >
          <IconSymbol
            ios_icon_name="bell.fill"
            android_material_icon_name="notifications"
            size={24}
            color={colors.text}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditName(user?.name || '');
              setEditPhone(user?.phone || '');
              setShowEditModal(true);
            }}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {household && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Household</Text>
            <View style={styles.householdCard}>
              <View style={styles.householdHeader}>
                <View>
                  <Text style={styles.householdName}>{household.name}</Text>
                  {household.address && (
                    <Text style={styles.householdAddress}>{household.address}</Text>
                  )}
                </View>
                <View style={styles.membersBadge}>
                  <IconSymbol
                    ios_icon_name="person.2.fill"
                    android_material_icon_name="people"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.membersCount}>{household.membersCount}</Text>
                </View>
              </View>
              
              {household.inviteCode && (
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                  <View style={styles.inviteCodeBox}>
                    <Text style={styles.inviteCode}>{household.inviteCode}</Text>
                    <TouchableOpacity onPress={handleShareInviteCode}>
                      <IconSymbol
                        ios_icon_name="square.and.arrow.up"
                        android_material_icon_name="share"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.householdActions}>
                <TouchableOpacity
                  style={styles.householdActionButton}
                  onPress={handleViewMembers}
                >
                  <IconSymbol
                    ios_icon_name="person.2"
                    android_material_icon_name="people"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.householdActionText}>View Members</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.householdActionButton, styles.dangerButton]}
                  onPress={handleLeaveHousehold}
                >
                  <IconSymbol
                    ios_icon_name="rectangle.portrait.and.arrow.right"
                    android_material_icon_name="exit_to_app"
                    size={20}
                    color={colors.error}
                  />
                  <Text style={[styles.householdActionText, styles.dangerText]}>
                    Leave Household
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
              value={editName}
              onChangeText={setEditName}
              editable={!isSubmitting}
            />
            <TextInput
              style={commonStyles.input}
              placeholder="Phone (optional)"
              placeholderTextColor={colors.textSecondary}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.modalButton]}
                onPress={() => setShowEditModal(false)}
                disabled={isSubmitting}
              >
                <Text style={buttonStyles.outlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={handleUpdateProfile}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.card} />
                ) : (
                  <Text style={buttonStyles.text}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.notificationsModal]}>
            <View style={styles.notificationsHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllNotificationsRead}>
                  <Text style={styles.markAllRead}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.notificationsList}>
              {notificationsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : notifications.length > 0 ? (
                notifications.map((notif) => (
                  <View
                    key={notif.id}
                    style={[
                      styles.notificationCard,
                      !notif.read && styles.unreadNotification,
                    ]}
                  >
                    <Text style={styles.notificationTitle}>{notif.title}</Text>
                    <Text style={styles.notificationMessage}>{notif.message}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No notifications</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 16 }]}
              onPress={() => setShowNotificationsModal(false)}
            >
              <Text style={buttonStyles.text}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Household Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.membersModal]}>
            <Text style={styles.modalTitle}>Household Members</Text>
            <ScrollView style={styles.membersList}>
              {loadingMembers ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : householdMembers.length > 0 ? (
                householdMembers.map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                    <View style={styles.memberRoleBadge}>
                      <Text style={styles.memberRoleText}>{member.role}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No members found</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 16 }]}
              onPress={() => setShowMembersModal(false)}
            >
              <Text style={buttonStyles.text}>Close</Text>
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
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.card,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  householdCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  householdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  householdName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  householdAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  membersCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  inviteCodeContainer: {
    marginBottom: 16,
  },
  inviteCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 2,
  },
  householdActions: {
    flexDirection: 'row',
    gap: 12,
  },
  householdActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    gap: 8,
  },
  householdActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.background,
  },
  dangerText: {
    color: colors.error,
  },
  signOutButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  notificationsModal: {
    maxHeight: '80%',
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  membersModal: {
    maxHeight: '80%',
  },
  membersList: {
    maxHeight: 400,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.card,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  memberRoleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
