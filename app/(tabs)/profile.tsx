
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    console.log('[Profile] Delete account button pressed');
    console.log('[Profile] User authenticated:', !!user);
    console.log('[Profile] Environment:', __DEV__ ? 'Development' : 'Production');
    
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              console.log('[Profile] Starting account deletion...');
              console.log('[Profile] Environment:', __DEV__ ? 'Development' : 'Production');
              console.log('[Profile] Platform:', Platform.OS);
              
              // Get the current session to get the access token
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError || !session) {
                console.error('[Profile] No valid session:', sessionError);
                throw new Error('Authentication required. Please sign in again.');
              }

              console.log('[Profile] Session valid, access token present:', !!session.access_token);

              // CRITICAL FIX: Use environment variable with proper fallback chain
              const projectUrl = 
                Constants.expoConfig?.extra?.supabaseUrl || 
                process.env.EXPO_PUBLIC_SUPABASE_URL || 
                'https://tkavowbmakdnqekweoro.supabase.co';
              
              const functionUrl = `${projectUrl}/functions/v1/delete-account`;
              
              console.log('[Profile] Calling delete-account Edge Function at:', functionUrl);

              // Call the Edge Function to permanently delete the account
              const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });

              console.log('[Profile] Response status:', response.status);

              const result = await response.json();

              if (!response.ok) {
                console.error('[Profile] Edge Function error:', result);
                throw new Error(result.error || 'Failed to delete account');
              }

              console.log('[Profile] Account deleted successfully:', result);

              // Sign out and clear all data (this will also clean up Realtime subscriptions)
              console.log('[Profile] Signing out...');
              await signOut();

              // Navigate to login
              console.log('[Profile] Navigating to login...');
              router.replace("/(auth)/login");

              // Show success message
              Alert.alert(
                "Account Deleted",
                "Your account has been permanently deleted."
              );
            } catch (error: any) {
              console.error('[Profile] Account deletion failed:', error);
              Alert.alert(
                "Deletion Failed",
                error.message || "Unable to delete account. Please try again."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Log component render for debugging
  console.log('[Profile] Rendering - User:', !!user, 'Environment:', __DEV__ ? 'Dev' : 'Prod');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, Platform.OS !== 'ios' && styles.contentContainerWithTabBar]}>
        <GlassView style={[styles.profileHeader, Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} glassEffectStyle="regular">
          <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="person" size={80} color={theme.colors.primary} />
          <Text style={[styles.name, { color: theme.colors.text }]}>{user?.name || "User"}</Text>
          <Text style={[styles.email, { color: theme.dark ? '#98989D' : '#666' }]}>{user?.email || ""}</Text>
        </GlassView>

        <GlassView style={[styles.section, Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} glassEffectStyle="regular">
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Account Management
          </Text>
          
          {/* CRITICAL: Delete button is ALWAYS visible when user is authenticated */}
          {/* NO __DEV__ or environment checks - required for App Store compliance */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} disabled={isDeleting || !user}>
            {isDeleting ? (
              <ActivityIndicator color="#FF3B30" />
            ) : (
              <>
                <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#FF3B30" />
                <Text style={styles.deleteText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>

          {!user && (
            <Text style={[styles.warningText, { color: theme.dark ? "#98989D" : "#666" }]}>
              You must be signed in to delete your account
            </Text>
          )}
        </GlassView>

        {/* Debug info - only in development */}
        {__DEV__ && (
          <View style={[styles.debugSection, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
            <Text style={[styles.debugTitle, { color: theme.colors.text }]}>Debug Info (Dev Only)</Text>
            <Text style={[styles.debugText, { color: theme.dark ? "#98989D" : "#666" }]}>
              Environment: {__DEV__ ? 'Development' : 'Production'}
            </Text>
            <Text style={[styles.debugText, { color: theme.dark ? "#98989D" : "#666" }]}>
              Platform: {Platform.OS}
            </Text>
            <Text style={[styles.debugText, { color: theme.dark ? "#98989D" : "#666" }]}>
              User: {user ? user.email : 'Not signed in'}
            </Text>
            <Text style={[styles.debugText, { color: theme.dark ? "#98989D" : "#666" }]}>
              Supabase URL: {Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'Using fallback'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  contentContainerWithTabBar: { paddingBottom: 100 },
  profileHeader: { alignItems: 'center', borderRadius: 12, padding: 32, marginBottom: 16, gap: 12 },
  name: { fontSize: 24, fontWeight: 'bold' },
  email: { fontSize: 16 },
  section: { borderRadius: 12, padding: 20, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 8, backgroundColor: 'rgba(255, 59, 48, 0.1)' },
  deleteText: { fontSize: 16, color: '#FF3B30', fontWeight: '600' },
  warningText: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  debugSection: { marginTop: 20, borderRadius: 12, padding: 16 },
  debugTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  debugText: { fontSize: 12, marginBottom: 4 },
});
