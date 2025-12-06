
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { UserRole } from '@/types';

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateUser, user } = useAuth();
  const { createHousehold, joinHousehold } = useHousehold();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('Adult');
  const [householdName, setHouseholdName] = useState('');
  const [householdAddress, setHouseholdAddress] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const roles: UserRole[] = ['Adult', 'Parent', 'Child', 'Roommate'];

  const handleRoleSelect = async (selectedRole: UserRole) => {
    setRole(selectedRole);
    
    // Update user role immediately
    try {
      await updateUser({ role: selectedRole });
      setStep(2);
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
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
        Alert.alert(
          'Success!',
          `Your household "${householdName}" has been created. Invite code: ${data.invite_code}`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/(home)'),
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
      const { data, error } = await joinHousehold(inviteCode.toUpperCase());
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }

      if (data) {
        Alert.alert(
          'Success!',
          `You have joined "${data.name}"`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/(home)'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Join household error:', error);
      Alert.alert('Error', error.message || 'Failed to join household');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>What&apos;s your role?</Text>
          <Text style={styles.subtitle}>
            This helps us customize your experience
          </Text>
        </View>

        <View style={styles.roleGrid}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r}
              style={styles.roleCard}
              onPress={() => handleRoleSelect(r)}
            >
              <Text style={styles.roleEmoji}>
                {r === 'Adult' ? '👤' : r === 'Parent' ? '👨‍👩‍👧' : r === 'Child' ? '👶' : '🤝'}
              </Text>
              <Text style={styles.roleText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isCreating ? 'Create Household' : 'Join Household'}
        </Text>
        <Text style={styles.subtitle}>
          {isCreating
            ? 'Start managing your home together'
            : 'Enter the invite code from your household'}
        </Text>
      </View>

      <View style={styles.form}>
        {isCreating ? (
          <React.Fragment>
            <TextInput
              style={commonStyles.input}
              placeholder="Household Name (e.g., Smith Family)"
              placeholderTextColor={colors.textSecondary}
              value={householdName}
              onChangeText={setHouseholdName}
              editable={!isLoading}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Address (optional)"
              placeholderTextColor={colors.textSecondary}
              value={householdAddress}
              onChangeText={setHouseholdAddress}
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
          </React.Fragment>
        ) : (
          <React.Fragment>
            <TextInput
              style={commonStyles.input}
              placeholder="Invite Code"
              placeholderTextColor={colors.textSecondary}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[buttonStyles.primary, styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleJoinHousehold}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={buttonStyles.text}>Join Household</Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
        )}

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsCreating(!isCreating)}
          disabled={isLoading}
        >
          <Text style={styles.switchText}>
            {isCreating
              ? 'Already have an invite code? Join instead'
              : 'Want to create a new household? Create instead'}
          </Text>
        </TouchableOpacity>
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
    marginBottom: 40,
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  roleCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  roleEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
