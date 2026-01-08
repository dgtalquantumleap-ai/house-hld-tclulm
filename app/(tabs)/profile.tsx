
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Modal, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) {
      console.log('[ProfileScreen] No user found, cannot delete account');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('[ProfileScreen] Starting account deletion process...');

      // Get the current session to get the access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('[ProfileScreen] No valid session:', sessionError);
        throw new Error('Authentication required. Please sign in again.');
      }

      // Get the project URL
      const projectUrl = 'https://tkavowbmakdnqekweoro.supabase.co';
      const functionUrl = `${projectUrl}/functions/v1/delete-account`;
      
      console.log('[ProfileScreen] Calling delete-account Edge Function...');

      // Call the Edge Function to permanently delete the account
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[ProfileScreen] Edge Function error:', result);
        throw new Error(result.error || 'Failed to delete account');
      }

      console.log('[ProfileScreen] Account deleted successfully:', result);

      // Close modal
      setShowDeleteModal(false);

      // Sign out and clear all data (this will also clean up Realtime subscriptions)
      console.log('[ProfileScreen] Signing out...');
      await signOut();

      // Navigate to login
      console.log('[ProfileScreen] Navigating to login...');
      router.replace("/(auth)/login");

      // Show success message
      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted."
      );
    } catch (error: any) {
      console.error('[ProfileScreen] Account deletion failed:', error);
      Alert.alert(
        "Deletion Failed",
        error.message || "Unable to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar
        ]}
      >
        <GlassView style={[
          styles.profileHeader,
          Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]} glassEffectStyle="regular">
          <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="person" size={80} color={theme.colors.primary} />
          <Text style={[styles.name, { color: theme.colors.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.email, { color: theme.dark ? '#98989D' : '#666' }]}>{user?.email || ''}</Text>
        </GlassView>

        <GlassView style={[
          styles.section,
          Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]} glassEffectStyle="regular">
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
            disabled={!user}
          >
            <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </GlassView>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color="#FF3B30" />
            
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Delete Account</Text>
            
            <Text style={[styles.modalMessage, { color: theme.dark ? '#98989D' : '#666' }]}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Delete</Text>
                )}
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
  profileHeader: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5EA',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
