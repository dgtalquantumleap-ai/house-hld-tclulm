
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import { useHousehold } from '@/hooks/useHousehold';
import { useInvitations } from '@/hooks/useInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export default function HouseholdScreen() {
  const { user } = useAuth();
  const { household, isLoading, refreshHousehold } = useHousehold();
  const { invitations, sendInvitation, refreshInvitations } = useInvitations();
  
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    if (household) {
      loadMembers();
    }
  }, [household?.id]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('household_id', household?.id);

      if (error) throw error;

      if (data) {
        setMembers(data.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          photoUrl: u.photo_url,
          role: u.role,
          householdId: u.household_id,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        })));
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshHousehold(), refreshInvitations(), loadMembers()]);
    setRefreshing(false);
  };

  const handleShareInviteCode = async () => {
    if (!household?.inviteCode) return;

    try {
      await Share.share({
        message: `Join our household "${household.name}" on HouseHLD! Use invite code: ${household.inviteCode}`,
        title: 'Join My Household',
      });
    } catch (error) {
      console.error('Error sharing invite code:', error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSendingInvite(true);
    const { error } = await sendInvitation(inviteEmail.trim());
    setIsSendingInvite(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    }
  };

  const isAdmin = household?.createdByUserId === user?.id || 
                  household?.adminUserIds?.includes(user?.id || '');

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!isAdmin) {
      Alert.alert('Error', 'Only admins can remove members');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .update({ household_id: null })
                .eq('id', memberId);

              if (error) throw error;

              Alert.alert('Success', `${memberName} has been removed`);
              loadMembers();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading || loadingMembers) {
    return (
      <View style={[styles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!household) {
    return (
      <View style={[styles.container, commonStyles.centerContent]}>
        <Text style={styles.emptyText}>No household found</Text>
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
        <Text style={styles.title}>{household.name}</Text>
        {household.address && (
          <Text style={styles.address}>{household.address}</Text>
        )}
      </View>

      {/* Invite Code Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite Code</Text>
        <View style={styles.inviteCodeCard}>
          <View style={styles.inviteCodeContent}>
            <Text style={styles.inviteCodeLabel}>Share this code:</Text>
            <Text style={styles.inviteCode}>{household.inviteCode}</Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareInviteCode}
          >
            <IconSymbol
              ios_icon_name="square.and.arrow.up"
              android_material_icon_name="share"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Invite by Email */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite by Email</Text>
        <View style={styles.inviteEmailContainer}>
          <TextInput
            style={[commonStyles.input, styles.inviteEmailInput]}
            placeholder="member@email.com"
            placeholderTextColor={colors.textSecondary}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[buttonStyles.primary, styles.sendButton, isSendingInvite && buttonStyles.disabled]}
            onPress={handleSendInvite}
            disabled={isSendingInvite}
          >
            {isSendingInvite ? (
              <ActivityIndicator color={colors.card} size="small" />
            ) : (
              <Text style={buttonStyles.text}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Invitations */}
      {invitations.filter(inv => inv.status === 'pending').length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Invitations</Text>
          {invitations
            .filter(inv => inv.status === 'pending')
            .map((invitation) => (
              <View key={invitation.id} style={styles.invitationCard}>
                <View style={styles.invitationContent}>
                  <Text style={styles.invitationEmail}>{invitation.email}</Text>
                  <Text style={styles.invitationStatus}>Pending</Text>
                </View>
                <Text style={styles.invitationDate}>
                  Sent {new Date(invitation.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
        </View>
      )}

      {/* Members Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Members ({members.length})
        </Text>
        {members.map((member) => {
          const isMemberAdmin = household.createdByUserId === member.id || 
                                household.adminUserIds?.includes(member.id);
          const isCurrentUser = member.id === user?.id;

          return (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {isCurrentUser && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  )}
                  {isMemberAdmin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberEmail}>{member.email}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              {isAdmin && !isCurrentUser && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMember(member.id, member.name)}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Household Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household Info</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Created</Text>
            <Text style={styles.statValue}>
              {new Date(household.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Members</Text>
            <Text style={styles.statValue}>{household.membersCount}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Your Role</Text>
            <Text style={styles.statValue}>{user?.role}</Text>
          </View>
        </View>
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inviteCodeCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  inviteCodeContent: {
    flex: 1,
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  shareButton: {
    padding: 12,
  },
  inviteEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteEmailInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 12,
  },
  sendButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  invitationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  invitationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  invitationStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  invitationDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.card,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  youBadge: {
    backgroundColor: colors.info,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.card,
  },
  adminBadge: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.card,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  removeButton: {
    padding: 8,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});
