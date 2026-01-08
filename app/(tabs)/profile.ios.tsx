
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuth();
  const { household } = useHousehold();
  const router = useRouter();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    try {
      await updateUser({ name: editName });
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCopyInviteCode = async () => {
    if (household?.inviteCode) {
      await Clipboard.setStringAsync(household.inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleManageHousehold = () => {
    router.push('/(tabs)/household');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* USER INFO CARD */}
        <View style={styles.profileHeader}>
          <IconSymbol
            ios_icon_name="person.circle.fill"
            android_material_icon_name="person"
            size={80}
            color={colors.primary}
          />
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* EDIT PROFILE SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[buttonStyles.primary, styles.button]}
            onPress={() => {
              setEditName(user?.name || '');
              setEditModalVisible(true);
            }}
          >
            <Text style={buttonStyles.primaryText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* HOUSEHOLD SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household</Text>
          {household ? (
            <>
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="house.fill"
                  android_material_icon_name="home"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoText}>{household.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="key.fill"
                  android_material_icon_name="vpn-key"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoText}>Invite Code: {household.inviteCode}</Text>
              </View>
              <TouchableOpacity
                style={[buttonStyles.secondary, styles.button]}
                onPress={handleCopyInviteCode}
              >
                <Text style={buttonStyles.secondaryText}>Copy Invite Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.button]}
                onPress={handleManageHousehold}
              >
                <Text style={buttonStyles.primaryText}>Manage Household</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[buttonStyles.primary, styles.button]}
              onPress={() => router.push('/household-setup')}
            >
              <Text style={buttonStyles.primaryText}>Join Household</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LEGAL SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://househld.app/privacy')}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://househld.app/terms')}
          >
            <Text style={styles.linkText}>Terms of Service</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* SIGN OUT BUTTON */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              placeholderTextColor={colors.textSecondary}
              value={editName}
              onChangeText={setEditName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.secondary, styles.modalButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={buttonStyles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={handleSaveProfile}
              >
                <Text style={buttonStyles.primaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
  },
  button: {
    marginTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: {
    fontSize: 16,
    color: colors.text,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
