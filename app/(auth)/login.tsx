
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

// CONFIGURATION: Set these to true when OAuth providers are enabled in Supabase
const GOOGLE_OAUTH_ENABLED = false;
const APPLE_OAUTH_ENABLED = false;

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, resendConfirmationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleLogin = async () => {
    // Prevent double-tap
    if (isLoading) return;

    setIsLoading(true);
    setShowResendButton(false);

    // Clean and validate inputs
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Error', 'Please enter email and password');
      setIsLoading(false);
      return;
    }

    // Create timeout promise (10 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );

    try {
      console.log('Login: Attempting to sign in');
      
      // Race between sign-in and timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      const { data, error } = await Promise.race([
        signInPromise,
        timeoutPromise
      ]) as any;

      if (error) throw error;
      if (!data.user) throw new Error('No user');

      console.log('Login: Sign in successful, navigating to home');
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('Sign-in error:', error);

      let message = 'Invalid email or password';
      
      // Handle timeout error
      if (error.message === 'Timeout') {
        message = 'Connection timeout. Check internet and try again.';
      } 
      // Check if the error is related to email confirmation
      else if (error.message) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('email confirmation') ||
            errorMessage.includes('verify your email')) {
          setShowResendButton(true);
          Alert.alert(
            'Email Not Confirmed',
            'Please verify your email address before signing in. Check your inbox for the confirmation link.\n\nDidn\'t receive the email?',
            [
              {
                text: 'Resend Email',
                onPress: handleResendConfirmation,
              },
              {
                text: 'OK',
                style: 'cancel',
              },
            ]
          );
          setIsLoading(false);
          return;
        } else {
          message = error.message;
        }
      }

      Alert.alert('Sign In Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const result = await resendConfirmationEmail(email);
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert(
          'Email Sent! ✉️',
          'A new confirmation email has been sent to your inbox. Please check your email and click the verification link.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      Alert.alert('Error', error.message || 'Failed to resend confirmation email');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!GOOGLE_OAUTH_ENABLED) {
      Alert.alert(
        'Coming Soon',
        'Google Sign In will be available soon. For now, please use email and password to sign in.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        // Check if it's a provider not enabled error
        if (result.error.toLowerCase().includes('provider') && 
            result.error.toLowerCase().includes('not enabled')) {
          Alert.alert(
            'Feature Not Available',
            'Google Sign In is not currently enabled. Please use email and password to sign in.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Google Sign In Failed', result.error);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!APPLE_OAUTH_ENABLED) {
      Alert.alert(
        'Coming Soon',
        'Apple Sign In will be available soon. For now, please use email and password to sign in.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithApple();
      if (result.error) {
        // Check if it's a provider not enabled error
        if (result.error.toLowerCase().includes('provider') && 
            result.error.toLowerCase().includes('not enabled')) {
          Alert.alert(
            'Feature Not Available',
            'Apple Sign In is not currently enabled. Please use email and password to sign in.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Apple Sign In Failed', result.error);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Apple');
    } finally {
      setIsLoading(false);
    }
  };

  // Show OAuth section only if at least one provider is enabled
  const showOAuthSection = GOOGLE_OAUTH_ENABLED || APPLE_OAUTH_ENABLED;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🏠</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your household</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={commonStyles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!isLoading}
          />

          <TextInput
            style={commonStyles.input}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!isLoading}
          />

          {showResendButton && (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendConfirmation}
              disabled={isResending}
            >
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.resendButtonText}>
                {isResending ? 'Sending...' : 'Resend Confirmation Email'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              buttonStyles.primary, 
              styles.button, 
              (isLoading || !email || !password) && styles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            <Text style={buttonStyles.text}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {showOAuthSection && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {GOOGLE_OAUTH_ENABLED && (
                <TouchableOpacity
                  style={[styles.oauthButton, styles.googleButton, isLoading && styles.buttonDisabled]}
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <IconSymbol
                    ios_icon_name="g.circle.fill"
                    android_material_icon_name="login"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.oauthButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              )}

              {APPLE_OAUTH_ENABLED && Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.oauthButton, styles.appleButton, isLoading && styles.buttonDisabled]}
                  onPress={handleAppleLogin}
                  disabled={isLoading}
                >
                  <IconSymbol
                    ios_icon_name="apple.logo"
                    android_material_icon_name="login"
                    size={20}
                    color={colors.card}
                  />
                  <Text style={[styles.oauthButtonText, styles.appleButtonText]}>
                    Continue with Apple
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/signup')}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>
              Don&apos;t have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  appleButton: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  appleButtonText: {
    color: colors.card,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkTextBold: {
    fontWeight: '700',
    color: colors.primary,
  },
});
