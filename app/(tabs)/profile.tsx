
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { household, isLoading: householdLoading } = useHousehold();
  const [membersCount, setMembersCount] = useState(0);

  useEffect(() => {
    loadMembersCount();
  }, [user?.householdId]);

  const loadMembersCount = async () => {
    if (!user?.householdId) return;

    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', user.householdId);

      if (error) throw error;
      setMembersCount(count || 0);
    } catch (error) {
      console.error('Error loading members count:', error);
    }
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
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
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
        message: `Join my household "${household.name}" on HouseHLD! Use invite code: ${household.inviteCode}`,
      });
    } catch (error) {
      console.error('Error sharing invite code:', error);
    }
  };

  const menuItems = [
    {
      id: 'household',
      title: 'Household Settings',
      icon: 'house.fill',
      androidIcon: 'home',
      onPress: () => Alert.alert('Coming Soon', 'Household settings will be available soon'),
    },
    {
      id: 'members',
      title: 'Manage Members',
      icon: 'person.2.fill',
      androidIcon: 'people',
      onPress: () => Alert.alert('Coming Soon', 'Member management will be available soon'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell.fill',
      androidIcon: 'notifications',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'questionmark.circle.fill',
      androidIcon: 'help',
      onPress: () => Alert.alert('Help', 'For support, please contact support@househld.app'),
    },
  ];

  if (householdLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'Member'}</Text>
        </View>
      </View>

      {household && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household</Text>
          <View style={styles.householdCard}>
            <Text style={styles.householdName}>{household.name}</Text>
            {household.address && (
              <Text style={styles.householdAddress}>{household.address}</Text>
            )}
            <Text style={styles.householdMembers}>{membersCount} members</Text>
            {household.inviteCode && (
              <View style={styles.inviteCodeContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
                  <Text style={styles.inviteCode}>{household.inviteCode}</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShareInviteCode}
                >
                  <IconSymbol
                    ios_icon_name="square.and.arrow.up"
                    android_material_icon_name="share"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name={item.icon}
                android_material_icon_name={item.androidIcon}
                size={24}
                color={colors.primary}
              />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[buttonStyles.outline, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={[buttonStyles.outlineText, styles.signOutText]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>HouseHLD v1.0.0</Text>
        <Text style={styles.footerText}>Made with ❤️ for families</Text>
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
    alignItems: 'center',
    marginBottom: 32,
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
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.highlight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
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
  householdName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  householdAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  householdMembers: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    padding: 12,
    borderRadius: 8,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  shareButton: {
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  signOutButton: {
    borderColor: colors.error,
  },
  signOutText: {
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
