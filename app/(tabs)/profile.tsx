
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
              setIsSigningOut(true);
              await signOut();
              router.replace('/(auth)');
            } catch (error: any) {
              console.error('Sign out error:', error);
              Alert.alert('Error', error.message || 'Failed to sign out');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const toggleSetting = async (key: keyof typeof settings, value: boolean) => {
    if (!settings) return;
    await updateSettings({ [key]: value });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{user?.role}</Text>
        </View>
      </View>

      {/* Household Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/household')}
        >
          <View style={styles.menuItemLeft}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.menuItemText}>Manage Household</Text>
          </View>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      {settings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="bell.fill"
                android_material_icon_name="notifications"
                size={24}
                color={colors.primary}
              />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Push Notifications</Text>
                <Text style={styles.settingSubtext}>Receive push notifications</Text>
              </View>
            </View>
            <Switch
              value={settings.pushNotificationsEnabled}
              onValueChange={(value) => toggleSetting('pushNotificationsEnabled', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={24}
                color={colors.secondary}
              />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Email Notifications</Text>
                <Text style={styles.settingSubtext}>Receive email updates</Text>
              </View>
            </View>
            <Switch
              value={settings.emailNotificationsEnabled}
              onValueChange={(value) => toggleSetting('emailNotificationsEnabled', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>Task Notifications</Text>
            </View>
            <Switch
              value={settings.taskNotifications}
              onValueChange={(value) => toggleSetting('taskNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>Event Notifications</Text>
            </View>
            <Switch
              value={settings.eventNotifications}
              onValueChange={(value) => toggleSetting('eventNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>Shopping Notifications</Text>
            </View>
            <Switch
              value={settings.shoppingNotifications}
              onValueChange={(value) => toggleSetting('shoppingNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>Poll Notifications</Text>
            </View>
            <Switch
              value={settings.pollNotifications}
              onValueChange={(value) => toggleSetting('pollNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>Meal Notifications</Text>
            </View>
            <Switch
              value={settings.mealNotifications}
              onValueChange={(value) => toggleSetting('mealNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>
      )}

      {/* Privacy Settings */}
      {settings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="eye.fill"
                android_material_icon_name="visibility"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Show Personal Calendar Events</Text>
                <Text style={styles.settingSubtext}>
                  Display your personal calendar events to household members
                </Text>
              </View>
            </View>
            <Switch
              value={settings.showPersonalCalendarEvents}
              onValueChange={(value) => toggleSetting('showPersonalCalendarEvents', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>
      )}

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity
          style={[buttonStyles.outline, styles.signOutButton]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={buttonStyles.outlineText}>Sign Out</Text>
          )}
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.card,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
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
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
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
    marginLeft: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  signOutButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
