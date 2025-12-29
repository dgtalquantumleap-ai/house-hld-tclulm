
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';

const COLORS = {
  primary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  dark: '#1F2937',
  gray: '#374151',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  textDark: '#374151',
};

const features = [
  { id: 1, iosIcon: 'calendar', androidIcon: 'event', label: 'Calendar', color: COLORS.primary },
  { id: 2, iosIcon: 'checkmark.square.fill', androidIcon: 'check-box', label: 'Tasks', color: COLORS.success },
  { id: 3, iosIcon: 'cart.fill', androidIcon: 'shopping-cart', label: 'Shopping', color: COLORS.warning },
  { id: 4, iosIcon: 'fork.knife', androidIcon: 'restaurant', label: 'Meals', color: COLORS.error },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('WelcomeScreen: Auth state:', { isAuthenticated, isLoading, hasUser: !!user, householdId: user?.householdId });
    
    if (!isLoading && isAuthenticated && user) {
      console.log('WelcomeScreen: User is authenticated, checking household status');
      
      // If user has a household, go to home
      if (user.householdId) {
        console.log('WelcomeScreen: User has household, redirecting to home');
        router.replace('/(tabs)/(home)');
      } else {
        // If user doesn't have a household, go to household setup
        console.log('WelcomeScreen: User has no household, redirecting to household setup');
        router.replace('/household-setup');
      }
    }
  }, [isAuthenticated, isLoading, user, user?.householdId]);

  useEffect(() => {
    // Fade-in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <IconSymbol
                ios_icon_name="house.fill"
                android_material_icon_name="home"
                size={40}
                color={COLORS.white}
              />
            </View>
            <Text style={styles.appName}>HouseHLD</Text>
            <Text style={styles.tagline}>Your family&apos;s command center</Text>
          </View>

          {/* VALUE CARD */}
          <View style={styles.valueCard}>
            <Text style={styles.valueHeading}>Create your household and:</Text>
            <View style={styles.featureList}>
              <View style={styles.featureListItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.featureListText}>Coordinate calendars</Text>
              </View>
              <View style={styles.featureListItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.featureListText}>Plan meals</Text>
              </View>
              <View style={styles.featureListItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.featureListText}>Share tasks</Text>
              </View>
              <View style={styles.featureListItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.featureListText}>Make decisions together</Text>
              </View>
            </View>
            <Text style={styles.valueFooter}>All in one place.</Text>
          </View>

          {/* FEATURE GRID - All icons have labels */}
          <View style={styles.featureGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                  <IconSymbol
                    ios_icon_name={feature.iosIcon}
                    android_material_icon_name={feature.androidIcon}
                    size={48}
                    color={feature.color}
                  />
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* FIXED CTA SECTION */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  
  // HEADER
  header: {
    alignItems: 'center',
    marginTop: 48,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },

  // VALUE CARD
  valueCard: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  valueHeading: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textDark,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureList: {
    marginLeft: 8,
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: 8,
    width: 16,
  },
  featureListText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textDark,
    flex: 1,
  },
  valueFooter: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textDark,
    marginTop: 8,
    fontWeight: '600',
  },

  // FEATURE GRID - All icons have labels
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingHorizontal: 16,
    gap: 24,
  },
  featureItem: {
    width: '45%',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
    textAlign: 'center',
  },

  // CTA SECTION
  ctaSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  signInLink: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
