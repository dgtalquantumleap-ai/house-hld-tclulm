
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { logError } from '@/utils/errorLogger';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Log error to error logging service
    logError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = async () => {
    try {
      // Try to reload the app using Expo Updates
      if (!__DEV__) {
        await Updates.reloadAsync();
      } else {
        // In development, just reset the error state
        this.handleReset();
      }
    } catch (error) {
      console.error('Failed to reload app:', error);
      // Fallback to just resetting the error state
      this.handleReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI matching the design
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.warningTriangle}>
                <Text style={styles.warningIcon}>!</Text>
              </View>
            </View>
            
            {/* Title */}
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              We&apos;re sorry for the inconvenience. The app encountered an unexpected error.
            </Text>

            {/* Error Details (Dev Mode Only) */}
            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetailsContainer}>
                <View style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
                  <Text style={styles.errorMessage}>{this.state.error.toString()}</Text>
                  {this.state.errorInfo && (
                    <Text style={styles.errorStack}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={this.handleReload}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Reload App</Text>
              </TouchableOpacity>
            </View>

            {/* Support Information */}
            <View style={styles.supportContainer}>
              <Text style={styles.supportText}>
                If this problem persists, please contact support at
              </Text>
              <Text style={styles.supportEmail}>support@househld.com</Text>
              <Text style={styles.errorCount}>Error count: {this.state.errorCount}</Text>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  iconContainer: {
    marginBottom: 32,
  },
  warningTriangle: {
    width: 80,
    height: 80,
    backgroundColor: '#FFB84D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '0deg' }],
  },
  warningIcon: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: -4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  errorDetailsContainer: {
    maxHeight: 150,
    width: '100%',
    marginBottom: 24,
  },
  errorDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorStack: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  supportContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  supportText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  supportEmail: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  errorCount: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 4,
  },
});
