
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);
    try {
      await updateUser({ name: name.trim(), phone: phone.trim() });
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            await signOut();
            router.replace('/(auth)');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to sign out');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) throw error;
              
              await signOut();
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
              router.replace('/(auth)');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar,
        ]}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <IconSymbol
            ios_icon_name="person.circle.fill"
            android_material_icon_name="person"
            size={80}
            color={colors.primary}
          />
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
            />
          ) : (
            <Text style={styles.name}>{user.name}</Text>
          )}
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="phone.fill"
              android_material_icon_name="phone"
              size={20}
              color={colors.textSecondary}
            />
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoText}>{user.phone || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText}>
              {user.householdId ? 'In household' : 'No household'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.actionButton]}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={buttonStyles.primaryText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.secondary, styles.actionButton]}
                onPress={() => {
                  setIsEditing(false);
                  setName(user.name || '');
                  setPhone(user.phone || '');
                }}
                disabled={isLoading}
              >
                <Text style={buttonStyles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.actionButton]}
                onPress={() => setIsEditing(true)}
              >
                <IconSymbol
                  ios_icon_name="pencil"
                  android_material_icon_name="edit"
                  size={18}
                  color="#fff"
                />
                <Text style={buttonStyles.primaryText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[buttonStyles.secondary, styles.actionButton]}
                onPress={() => router.push('/(tabs)/household')}
              >
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="group"
                  size={18}
                  color={colors.primary}
                />
                <Text style={buttonStyles.secondaryText}>View Household</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signOutButton, styles.actionButton]}
                onPress={handleSignOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="arrow.right.square"
                      android_material_icon_name="logout"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.signOutText}>Sign Out</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, styles.actionButton]}
                onPress={handleDeleteAccount}
                disabled={isLoading}
              >
                <IconSymbol
                  ios_icon_name="trash"
                  android_material_icon_name="delete"
                  size={18}
                  color={colors.error}
                />
                <Text style={styles.deleteText}>Delete Account</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
    minWidth: 200,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  infoInput: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 16,
  },
  signOutText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 16,
  },
  deleteText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
