
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import { useInvitations } from '@/hooks/useInvitations';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { UserRole } from '@/types';
import { IconSymbol } from '@/components/IconSymbol';
import * as ImagePicker from 'expo-image-picker';

type CalendarProvider = 'google' | 'apple';

interface InviteEmail {
  id: string;
  value: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateUser, user, refreshUserProfile } = useAuth();
  const { createHousehold, joinHousehold } = useHousehold();
  const { sendInvitation } = useInvitations();
  
  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState('');
  const [householdAddress, setHouseholdAddress] = useState('');
  const [householdPhoto, setHouseholdPhoto] = useState<string | null>(null);
  const [primaryEmail, setPrimaryEmail] = useState(user?.email || '');
  const [inviteEmails, setInviteEmails] = useState<InviteEmail[]>([{ id: '1', value: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdHouseholdId, setCreatedHouseholdId] = useState<string | null>(null);

  const handlePickImage = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setHouseholdPhoto(result.assets[0].uri);
      }
    } catch (error: unknown) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCreateHousehold = async (): Promise<void> => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    if (!primaryEmail.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating household:', householdName);
      const { data, error } = await createHousehold(householdName, householdAddress);
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }

      if (data) {
        setCreatedHouseholdId(data.id);
        console.log('Household created successfully, refreshing user profile');
        
        // CRITICAL FIX: Refresh user profile to get updated household_id
        await refreshUserProfile();
        
        console.log('User profile refreshed, redirecting to dashboard');
        
        // Show success message and redirect to dashboard immediately
        Alert.alert(
          'Success!',
          `Your household "${householdName}" has been created.`,
          [
            {
              text: 'Go to Dashboard',
              onPress: () => {
                // Navigate to dashboard immediately
                router.replace('/(tabs)/(home)');
              },
            },
          ]
        );
      }
    } catch (error: unknown) {
      console.error('Create household error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create household';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvitations = async (): Promise<void> => {
    const validEmails = inviteEmails.filter((email: InviteEmail) => email.value.trim() && email.value.includes('@'));
    
    if (validEmails.length === 0) {
      // Skip if no invitations
      setStep(2);
      return;
    }

    setIsLoading(true);
    try {
      const promises = validEmails.map((email: InviteEmail) => sendInvitation(email.value.trim()));
      const results = await Promise.all(promises);
      
      const errors = results.filter((r: { error?: string }) => r.error);
      if (errors.length > 0) {
        Alert.alert('Warning', `Some invitations failed to send: ${errors.map((e: { error?: string }) => e.error).join(', ')}`);
      } else {
        Alert.alert('Success', `Invitations sent to ${validEmails.length} member(s)`);
      }
      
      setStep(2);
    } catch (error: unknown) {
      console.error('Send invitations error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitations';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipCalendar = (): void => {
    router.replace('/(tabs)/(home)');
  };

  const handleConnectCalendar = (provider: CalendarProvider): void => {
    Alert.alert(
      'Calendar Connection',
      `Connect ${provider === 'google' ? 'Google Calendar' : 'Apple iCloud'} via OAuth. This feature will be implemented with OAuth flow.`,
      [
        {
          text: 'Skip for now',
          onPress: handleSkipCalendar,
        },
      ]
    );
  };

  const addInviteEmailField = (): void => {
    const newId = Date.now().toString();
    setInviteEmails([...inviteEmails, { id: newId, value: '' }]);
  };

  const updateInviteEmail = (id: string, value: string): void => {
    setInviteEmails(inviteEmails.map(email => 
      email.id === id ? { ...email, value } : email
    ));
  };

  const removeInviteEmail = (id: string): void => {
    setInviteEmails(inviteEmails.filter(email => email.id !== id));
  };

  // Step 0: Intro Screen - One Home. Everyone Connected.
  if (step === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={64}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>One Home. Everyone Connected.</Text>
          <Text style={styles.subtitle}>
            Create a shared household where everyone stays aligned — from daily tasks to important dates.
          </Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
            {householdPhoto ? (
              <Image source={{ uri: householdPhoto }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="add-a-photo"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text style={styles.photoText}>Add Photo (Optional)</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Household Name *</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="e.g., Smith Family"
            placeholderTextColor={colors.textSecondary}
            value={householdName}
            onChangeText={setHouseholdName}
            editable={!isLoading}
          />

          <Text style={styles.label}>Address (Optional)</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="123 Main St, City, State"
            placeholderTextColor={colors.textSecondary}
            value={householdAddress}
            onChangeText={setHouseholdAddress}
            editable={!isLoading}
          />

          <Text style={styles.label}>Primary Email *</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="your@email.com"
            placeholderTextColor={colors.textSecondary}
            value={primaryEmail}
            onChangeText={setPrimaryEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[buttonStyles.primary, styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleCreateHousehold}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={buttonStyles.text}>Create My Household</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.validationNote}>
            * You cannot proceed without completing this step
          </Text>
        </View>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Setting up household...</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // Step 1: Core Features
  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Everything Your Household Needs</Text>
          <Text style={styles.subtitle}>
            Manage your home life with these essential tools
          </Text>
        </View>

        <View style={styles.featuresList}>
          <View style={styles.featureRow}>
            <IconSymbol
              ios_icon_name="calendar.circle.fill"
              android_material_icon_name="event"
              size={28}
              color={colors.primary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Shared calendars & reminders</Text>
              <Text style={styles.featureDescription}>Keep everyone informed about important dates and events</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={28}
              color={colors.accent}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Tasks for everyone</Text>
              <Text style={styles.featureDescription}>Assign and track household chores and responsibilities</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <IconSymbol
              ios_icon_name="fork.knife"
              android_material_icon_name="restaurant"
              size={28}
              color={colors.secondary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Meal planning & shopping lists</Text>
              <Text style={styles.featureDescription}>Plan meals and create shared shopping lists</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <IconSymbol
              ios_icon_name="chart.bar.fill"
              android_material_icon_name="poll"
              size={28}
              color={colors.primary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Decisions made together</Text>
              <Text style={styles.featureDescription}>Use polls to make household decisions collaboratively</Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[buttonStyles.primary, styles.button]}
            onPress={() => setStep(2)}
          >
            <Text style={buttonStyles.text}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Step 2: Invite Members
  if (step === 2) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite Who You Live With</Text>
          <Text style={styles.subtitle}>
            Add family members, partners, or roommates so everyone sees what matters — without confusion or endless messages.
          </Text>
        </View>

        <View style={styles.form}>
          {inviteEmails.map((email: InviteEmail) => (
            <View key={email.id} style={styles.inviteRow}>
              <TextInput
                style={[commonStyles.input, styles.inviteInput]}
                placeholder="member@email.com"
                placeholderTextColor={colors.textSecondary}
                value={email.value}
                onChangeText={(value: string) => updateInviteEmail(email.id, value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              {inviteEmails.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeInviteEmail(email.id)}
                >
                  <IconSymbol
                    ios_icon_name="minus.circle.fill"
                    android_material_icon_name="remove-circle"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={addInviteEmailField}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.addButtonText}>Add Another Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendInvitations}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={buttonStyles.text}>Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipCalendar}
            disabled={isLoading}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              Invitations will be sent via email. Members can accept and join your household.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  photoButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  button: {
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  validationNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeButton: {
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginTop: 16,
  },
});
