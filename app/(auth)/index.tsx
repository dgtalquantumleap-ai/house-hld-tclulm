
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    console.log('WelcomeScreen: Auth state:', { isAuthenticated, isLoading, hasUser: !!user, householdId: user?.householdId });
    
    if (!isLoading && isAuthenticated && user) {
      console.log('WelcomeScreen: User is authenticated, checking household status');
      
      // If user has a household, go to home
      if (user.householdId) {
        console.log('WelcomeScreen: User has household, redirecting to home');
        router.replace('/(tabs)/(home)');
      } else {
        // If user doesn't have a household, go to onboarding
        console.log('WelcomeScreen: User has no household, redirecting to onboarding');
        router.replace('/(auth)/onboarding');
      }
    }
  }, [isAuthenticated, isLoading, user, user?.householdId]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={80}
              color={colors.primary}
            />
          </View>
          <Text style={styles.appName}>HouseHLD</Text>
          <Text style={styles.tagline}>Organize your home. Together.</Text>
        </View>

        {/* Marketing Hook */}
        <View style={styles.hookSection}>
          <Text style={styles.hookText}>
            Create a shared household to manage schedules, tasks, meals, and shopping — all in one simple place for everyone at home.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="calendar.circle.fill"
              android_material_icon_name="event"
              size={32}
              color={colors.accent}
            />
            <Text style={styles.featureText}>Shared Calendar</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.featureText}>Task Management</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="cart.fill"
              android_material_icon_name="shopping-cart"
              size={32}
              color={colors.secondary}
            />
            <Text style={styles.featureText}>Shopping Lists</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="fork.knife"
              android_material_icon_name="restaurant"
              size={32}
              color={colors.accent}
            />
            <Text style={styles.featureText}>Meal Planner</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="chart.bar.fill"
              android_material_icon_name="poll"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.featureText}>Family Polls</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={32}
              color={colors.secondary}
            />
            <Text style={styles.featureText}>Real-time Sync</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[buttonStyles.primary, styles.button]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={buttonStyles.text}>Create My Household</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>Already part of a household? Sign in</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Trusted by families, couples, and roommates to stay in sync at home.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  hookSection: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  hookText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureItem: {
    width: (width - 72) / 3,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  button: {
    marginBottom: 16,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
