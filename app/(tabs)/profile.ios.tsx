
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { useHousehold } from '@/hooks/useHousehold';
import { User } from '@/types';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuth();
  const { household, members, loading: householdLoading, refreshHousehold } = useHousehold();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHousehold();
    setRefreshing(false);
  };

  const handleSaveProfile = async () => {
    try {
      await updateUser({ name: editName, phone: editPhone });
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // TODO: Backend Integration - Call the delete-account endpoint to permanently delete user data
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      await signOut();
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } catch (error) {
      console.log('Delete account error:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  const openLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  if (!user) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="account-circle" size={80} color={colors.primary} />
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.role}>{user.role}</Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
          <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={20} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.householdButton}
          onPress={() => router.push('/(tabs)/household')}
        >
          <IconSymbol ios_icon_name="house.fill" android_material_icon_name="home" size={24} color="#fff" />
          <Text style={styles.householdButtonText}>Manage Household</Text>
        </TouchableOpacity>

        {household && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Household</Text>
            <View style={styles.card}>
              <Text style={styles.householdName}>{household.name}</Text>
              {household.address && <Text style={styles.householdAddress}>{household.address}</Text>}
            </View>
          </View>
        )}

        {members && members.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Household Members</Text>
            {members.map((member: User, index: number) => (
              <View key={member.id || index} style={styles.memberCard}>
                <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={24} color={colors.primary} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.linkButton} onPress={() => openLink('https://househld.app/privacy')}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => openLink('https://househld.app/terms')}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => openLink('https://househld.app/cookies')}>
            <Text style={styles.linkText}>Cookie Policy</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[buttonStyles.primary, styles.signOutButton]} onPress={signOut}>
          <Text style={buttonStyles.text}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.deleteButton]} 
          onPress={() => setDeleteModalVisible(true)}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={colors.textSecondary}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor={colors.textSecondary}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.secondary, styles.modalButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={buttonStyles.outlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={handleSaveProfile}
              >
                <Text style={buttonStyles.text}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.warningText}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.secondary, styles.modalButton]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={buttonStyles.outlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButtonModal, styles.modalButton]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 16,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  householdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    gap: 12,
  },
  householdButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  householdAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  memberRole: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: {
    fontSize: 16,
    color: colors.text,
  },
  signOutButton: {
    margin: 16,
    marginTop: 8,
  },
  deleteButton: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonModal: {
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
