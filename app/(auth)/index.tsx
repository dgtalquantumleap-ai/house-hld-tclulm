
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🏠</Text>
            <Text style={styles.title}>HouseHLD</Text>
            <Text style={styles.subtitle}>
              Manage your household together
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Shared Tasks & Chores</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Shopping Lists</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Family Calendar</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Expense Tracking</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[buttonStyles.primary, styles.button]}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={buttonStyles.text}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.outline, styles.button, styles.outlineButton]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={[buttonStyles.outlineText, styles.outlineButtonText]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.card,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.card,
    opacity: 0.9,
    textAlign: 'center',
  },
  features: {
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    color: colors.card,
  },
  featureText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
  },
  buttons: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
  outlineButton: {
    backgroundColor: colors.card,
    borderColor: colors.card,
  },
  outlineButtonText: {
    color: colors.primary,
  },
});
