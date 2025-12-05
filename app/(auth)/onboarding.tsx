
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, buttonStyles, commonStyles } from '@/styles/commonStyles';
import { UserRole } from '@/types';

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('Adult');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(true);

  const roles: UserRole[] = ['Adult', 'Parent', 'Child', 'Roommate'];

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    try {
      console.log('Creating household:', householdName);
      // TODO: Create household in Supabase
      // const { data, error } = await supabase
      //   .from('households')
      //   .insert([{ name: householdName, created_by_user_id: user.id }])
      //   .select()
      //   .single();
      
      await updateUser({ role, householdId: '1' });
      router.replace('/(tabs)/(home)');
    } catch (error) {
      console.error('Create household error:', error);
      Alert.alert('Error', 'Failed to create household');
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      console.log('Joining household with code:', inviteCode);
      // TODO: Join household in Supabase
      // const { data, error } = await supabase
      //   .from('households')
      //   .select('*')
      //   .eq('invite_code', inviteCode)
      //   .single();
      
      await updateUser({ role, householdId: '1' });
      router.replace('/(tabs)/(home)');
    } catch (error) {
      console.error('Join household error:', error);
      Alert.alert('Error', 'Invalid invite code');
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
            />

            <TouchableOpacity
              style={[buttonStyles.primary, styles.button]}
              onPress={handleCreateHousehold}
            >
              <Text style={buttonStyles.text}>Create Household</Text>
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
            />

            <TouchableOpacity
              style={[buttonStyles.primary, styles.button]}
              onPress={handleJoinHousehold}
            >
              <Text style={buttonStyles.text}>Join Household</Text>
            </TouchableOpacity>
          </React.Fragment>
        )}

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsCreating(!isCreating)}
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
