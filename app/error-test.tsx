
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { logError, logWarning, logInfo } from '@/utils/errorLogger';

export default function ErrorTestScreen() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a test error to demonstrate the ErrorBoundary!');
  }

  const triggerError = () => {
    setShouldThrow(true);
  };

  const triggerAsyncError = async () => {
    try {
      throw new Error('This is an async error');
    } catch (error) {
      logError(error as Error, {
        component: 'ErrorTestScreen',
        action: 'triggerAsyncError',
      });
    }
  };

  const triggerWarning = () => {
    logWarning('This is a test warning', {
      component: 'ErrorTestScreen',
      action: 'triggerWarning',
    });
  };

  const triggerInfo = () => {
    logInfo('This is a test info message', {
      component: 'ErrorTestScreen',
      action: 'triggerInfo',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Error Handling Test</Text>
        <Text style={styles.subtitle}>
          Use these buttons to test different error scenarios
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error Boundary Test</Text>
          <TouchableOpacity
            style={[styles.button, styles.errorButton]}
            onPress={triggerError}
          >
            <Text style={styles.buttonText}>Trigger Error Boundary</Text>
          </TouchableOpacity>
          <Text style={styles.description}>
            This will throw an error that will be caught by the ErrorBoundary component
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Async Error Test</Text>
          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={triggerAsyncError}
          >
            <Text style={styles.buttonText}>Trigger Async Error</Text>
          </TouchableOpacity>
          <Text style={styles.description}>
            This will trigger an async error that will be logged but not crash the app
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warning Test</Text>
          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={triggerWarning}
          >
            <Text style={styles.buttonText}>Trigger Warning</Text>
          </TouchableOpacity>
          <Text style={styles.description}>
            This will log a warning message to the console
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info Test</Text>
          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={triggerInfo}
          >
            <Text style={styles.buttonText}>Trigger Info Log</Text>
          </TouchableOpacity>
          <Text style={styles.description}>
            This will log an info message to the console
          </Text>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>📝 Note:</Text>
          <Text style={styles.noteText}>
            Check the console to see the logged messages. In development mode, 
            you&apos;ll see detailed error information.
          </Text>
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
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
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
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  infoButton: {
    backgroundColor: '#3B82F6',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  note: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginTop: 16,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
