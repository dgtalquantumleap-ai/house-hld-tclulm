
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import { IconSymbol } from '@/components/IconSymbol';

const COLORS = {
  primary: '#6366F1',
  success: '#10B981',
  dark: '#1F2937',
  gray: '#6B7280',
  lightGray: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

export default function HouseholdSetupScreen() {
  const router = useRouter();
  const { user, refreshUserProfile, isAuthenticated } = useAuth();
  const { createHousehold, joinHousehold } = useHousehold();
  
  const [step, setStep] = useState<'choice' | 'create' | 'join'>('choice');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if user already has a household
  useEffect(() => {
    console.log('HouseholdSetup: Checking user state', {
      isAuthenticated,
      hasUser: !!user,
      householdId: user?.householdId,
    });

    if (!isAuthenticated) {
      console.log('HouseholdSetup: Not authenticated, redirecting to auth');
      router.replace('/(auth)/');
      return;
    }

    if (user?.householdId) {
      console.log('HouseholdSetup: User already has household, redirecting to home');
      router.replace('/(tabs)/(home)/');
    }
  }, [user?.householdId, isAuthenticated]);

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating household:', householdName);
      const { data, error } = await createHousehold(householdName, '');
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }

      if (data) {
        console.log('Household created successfully, refreshing user profile');
        
        // Refresh user profile to get updated household_id
        await refreshUserProfile();
        
        console.log('User profile refreshed, redirecting to home');
        
        // Show success and redirect
        Alert.alert(
          'Success!',
          `Your household "${householdName}" has been created.`,
          [
            {
              text: 'Go to Home',
              onPress: () => {
                router.replace('/(tabs)/(home)/');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Create household error:', error);
      Alert.alert('Error', error.message || 'Failed to create household');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Joining household with code:', inviteCode);
      const { error } = await joinHousehold(inviteCode.trim());
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }

      console.log('Joined household successfully, refreshing user profile');
      
      // Refresh user profile to get updated household_id
      await refreshUserProfile();
      
      console.log('User profile refreshed, redirecting to home');
      
      // Show success and redirect
      Alert.alert(
        'Success!',
        'You have joined the household.',
        [
          {
            text: 'Go to Home',
            onPress: () => {
              router.replace('/(tabs)/(home)/');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Join household error:', error);
      Alert.alert('Error', error.message || 'Failed to join household');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Choice between Create or Join
  if (step === 'choice') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Set Up Household</Text>
            <Text style={styles.subtitle}>Choose how you&apos;d like to get started</Text>
          </View>

          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => setStep('create')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={48}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.optionTitle}>Create New</Text>
            <Text style={styles.optionDescription}>Start with your family</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={() => setStep('join')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${COLORS.success}15` }]}>
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="group"
                size={48}
                color={COLORS.success}
              />
            </View>
            <Text style={styles.optionTitle}>Join Existing</Text>
            <Text style={styles.optionDescription}>Use invite code</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Create Household
  if (step === 'create') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setStep('choice')}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
              <IconSymbol
                ios_icon_name="house.fill"
                android_material_icon_name="home"
                size={48}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.title}>Name Household</Text>
            <Text style={styles.subtitle}>Choose a name for your household</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <IconSymbol
                ios_icon_name="house"
                android_material_icon_name="home"
                size={20}
                color={COLORS.gray}
              />
              <TextInput
                style={styles.input}
                placeholder="The Smith Family"
                placeholderTextColor={COLORS.gray}
                value={householdName}
                onChangeText={setHouseholdName}
                editable={!isLoading}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleCreateHousehold}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 3: Join Household
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setStep('choice')}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${COLORS.success}15` }]}>
            <IconSymbol
              ios_icon_name="key.fill"
              android_material_icon_name="vpn-key"
              size={48}
              color={COLORS.success}
            />
          </View>
          <Text style={styles.title}>Enter Code</Text>
          <Text style={styles.subtitle}>Enter the invite code you received</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <IconSymbol
              ios_icon_name="key"
              android_material_icon_name="vpn-key"
              size={20}
              color={COLORS.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="ABC-123-XYZ"
              placeholderTextColor={COLORS.gray}
              value={inviteCode}
              onChangeText={setInviteCode}
              editable={!isLoading}
              autoCapitalize="characters"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleJoinHousehold}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Join</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.dark,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
