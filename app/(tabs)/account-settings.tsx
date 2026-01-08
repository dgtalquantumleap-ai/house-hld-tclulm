
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AccountSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) {
      console.log('[AccountSettings] No user found, cannot delete account');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('[AccountSettings] Starting account deletion process...');

      // Get the current session to get the access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('[AccountSettings] No valid session:', sessionError);
        throw new Error('Authentication required. Please sign in again.');
      }

      // Get the project URL
      const projectUrl = 'https://tkavowbmakdnqekweoro.supabase.co';
      const functionUrl = `${projectUrl}/functions/v1/delete-account`;
      
      console.log('[AccountSettings] Calling delete-account Edge Function...');

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
        console.error('[AccountSettings] Edge Function error:', result);
        throw new Error(result.error || 'Failed to delete account');
      }

      console.log('[AccountSettings] Account deleted successfully:', result);

      // Close modal
      setShowDeleteModal(false);

      // Sign out and clear all data (this will also clean up Realtime subscriptions)
      console.log('[AccountSettings] Signing out...');
      await signOut();

      // Navigate to login
      console.log('[AccountSettings] Navigating to login...');
      router.replace("/(auth)/login");

      // Show success message
      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted."
      );
    } catch (error: any) {
      console.error('[AccountSettings] Account deletion failed:', error);
      Alert.alert(
        "Deletion Failed",
        error.message || "Unable to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const showDeleteConfirmation = () => {
    setShowDeleteModal(true);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Account Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar
        ]}
      >
        <GlassView 
          style={[
            styles.section,
            Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]} 
          glassEffectStyle="regular"
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Danger Zone
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.dark ? "#98989D" : "#666" }]}>
            Permanently delete your account and all associated data.
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={showDeleteConfirmation}
            disabled={!user}
          >
            <IconSymbol
              ios_icon_name="trash.fill"
              android_material_icon_name="delete"
              size={20}
              color="#fff"
            />
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.dark ? "#1C1C1E" : "#fff" },
            ]}
          >
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color="#FF3B30"
            />

            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Delete Account?
            </Text>

            <Text style={[styles.modalMessage, { color: theme.dark ? "#98989D" : "#666" }]}>
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
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
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
  section: {
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#E5E5EA",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmDeleteButton: {
    backgroundColor: "#FF3B30",
  },
  confirmDeleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
