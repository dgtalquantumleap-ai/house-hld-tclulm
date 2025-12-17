
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

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateUser, user } = useAuth();
  const { createHousehold, joinHousehold } = useHousehold();
  const { sendInvitation } = useInvitations();
  
  const [step, setStep] = useState(1);
  const [householdName, setHouseholdName] = useState('');
  const [householdAddress, setHouseholdAddress] = useState('');
  const [householdPhoto, setHouseholdPhoto] = useState<string | null>(null);
  const [primaryEmail, setPrimaryEmail] = useState(user?.email || '');
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [createdHouseholdId, setCreatedHouseholdId] = useState<string | null>(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setHouseholdPhoto(result.assets[0].uri);
    }
  };

  const handleCreateHousehold = async () => {
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
        Alert.alert(
          'Success!',
          `Your household "${householdName}" has been created.`,
          [
            {
              text: 'Continue',
              onPress: () => setStep(2),
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

  const handleSendInvitations = async () => {
    const validEmails = inviteEmails.filter(email => email.trim() && email.includes('@'));
    
    if (validEmails.length === 0) {
      // Skip if no invitations
      setStep(3);
      return;
    }

    setIsLoading(true);
    try {
      const promises = validEmails.map(email => sendInvitation(email.trim()));
      const results = await Promise.all(promises);
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        Alert.alert('Warning', `Some invitations failed to send: ${errors.map(e => e.error).join(', ')}`);
      } else {
        Alert.alert('Success', `Invitations sent to ${validEmails.length} member(s)`);
      }
      
      setStep(3);
    } catch (error: any) {
      console.error('Send invitations error:', error);
      Alert.alert('Error', error.message || 'Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipCalendar = () => {
    router.replace('/(tabs)/(home)');
  };

  const handleConnectCalendar = (provider: 'google' | 'apple') => {
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

  const addInviteEmailField = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  const updateInviteEmail = (index: number, value: string) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  const removeInviteEmail = (index: number) => {
    const newEmails = inviteEmails.filter((_, i) => i !== index);
    setInviteEmails(newEmails);
  };

  // Step 1: Create Household
  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create your Household</Text>
          <Text style={styles.subtitle}>
            Let&apos;s get started by setting up your household
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
              <Text style={buttonStyles.text}>Create Household</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.validationNote}>
            * You cannot proceed without completing this step
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Step 2: Invite Members
  if (step === 2) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite Household Members</Text>
          <Text style={styles.subtitle}>
            Add family members or roommates to your household
          </Text>
        </View>

        <View style={styles.form}>
          {inviteEmails.map((email, index) => (
            <View key={index} style={styles.inviteRow}>
              <TextInput
                style={[commonStyles.input, styles.inviteInput]}
                placeholder="member@email.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={(value) => updateInviteEmail(index, value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              {inviteEmails.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeInviteEmail(index)}
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
              <Text style={buttonStyles.text}>Send Invitations</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setStep(3)}
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

  // Step 3: Calendar Connection
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect Your Calendar</Text>
        <Text style={styles.subtitle}>
          Sync your calendar to keep everyone on the same page (Optional)
        </Text>
      </View>

      <View style={styles.form}>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => handleConnectCalendar('google')}
        >
          <View style={styles.calendarIcon}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={32}
              color={colors.primary}
            />
          </View>
          <View style={styles.calendarContent}>
            <Text style={styles.calendarTitle}>Google Calendar</Text>
            <Text style={styles.calendarSubtitle}>Sync with Google Calendar</Text>
          </View>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => handleConnectCalendar('apple')}
        >
          <View style={styles.calendarIcon}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={32}
              color={colors.accent}
            />
          </View>
          <View style={styles.calendarContent}>
            <Text style={styles.calendarTitle}>Apple iCloud</Text>
            <Text style={styles.calendarSubtitle}>Sync with iCloud Calendar</Text>
          </View>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[buttonStyles.secondary, styles.button]}
          onPress={handleSkipCalendar}
        >
          <Text style={[buttonStyles.text, { color: colors.text }]}>
            Skip - I&apos;ll do this later
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="lightbulb.fill"
            android_material_icon_name="lightbulb"
            size={20}
            color={colors.accent}
          />
          <Text style={styles.infoText}>
            You can always connect your calendar later from Settings. We&apos;ll remind you!
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
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
    lineHeight: 24,
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
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  calendarIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContent: {
    flex: 1,
    marginLeft: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  calendarSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
