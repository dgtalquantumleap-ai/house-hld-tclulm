
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { clearAuthStorage, validateAndRecoverSession } from '@/utils/authRecovery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';

// ONLY SHOW IN DEVELOPMENT MODE
const IS_DEV = __DEV__;

export default function AuthDebugScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);

  // Redirect if not in development mode
  if (!IS_DEV) {
    return (
      <View style={styles.container}>
        <View style={styles.notAvailableContainer}>
          <Text style={styles.notAvailableText}>
            This screen is only available in development mode.
          </Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkSession = async () => {
    try {
      addLog('Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`❌ Session error: ${error.message}`);
      } else if (session) {
        addLog(`✅ Session found for: ${session.user.email}`);
        addLog(`Token expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
      } else {
        addLog('ℹ️ No session found');
      }
    } catch (error: any) {
      addLog(`❌ Exception: ${error.message}`);
    }
  };

  const checkStorage = async () => {
    try {
      addLog('Checking AsyncStorage...');
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') ||
        key.includes('sb-')
      );
      
      addLog(`Found ${authKeys.length} auth-related keys`);
      
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        addLog(`Key: ${key.substring(0, 30)}... (${value?.length || 0} chars)`);
      }
    } catch (error: any) {
      addLog(`❌ Storage error: ${error.message}`);
    }
  };

  const validateSession = async () => {
    try {
      addLog('Validating session...');
      const isValid = await validateAndRecoverSession();
      
      if (isValid) {
        addLog('✅ Session is valid');
      } else {
        addLog('❌ Session is invalid or missing');
      }
    } catch (error: any) {
      addLog(`❌ Validation error: ${error.message}`);
    }
  };

  const clearStorage = async () => {
    Alert.alert(
      'Clear Auth Storage',
      'This will sign you out and clear all auth data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              addLog('Clearing auth storage...');
              await clearAuthStorage();
              addLog('✅ Storage cleared successfully');
              Alert.alert('Success', 'Auth storage cleared. Please restart the app.');
            } catch (error: any) {
              addLog(`❌ Clear error: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Auth Debug (Dev Only)</Text>
      </View>

      <View style={styles.buttonGrid}>
        <TouchableOpacity style={styles.button} onPress={checkSession}>
          <Text style={styles.buttonText}>Check Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={checkStorage}>
          <Text style={styles.buttonText}>Check Storage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={validateSession}>
          <Text style={styles.buttonText}>Validate Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearStorage}>
          <Text style={styles.buttonText}>Clear Storage</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsHeader}>
        <Text style={styles.logsTitle}>Logs</Text>
        <TouchableOpacity onPress={clearLogs}>
          <Text style={styles.clearLogsText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logsContainer}>
        {logs.length === 0 ? (
          <Text style={styles.noLogsText}>No logs yet. Tap a button above to start debugging.</Text>
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  notAvailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notAvailableText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButtonHeader: {
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '47%',
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  clearLogsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  noLogsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  logText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
