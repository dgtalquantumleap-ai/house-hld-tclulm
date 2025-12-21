
# Authentication Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Blocked a frame with origin" Error

**Symptoms:**
- Cross-origin error in console
- App fails to load user profile
- Stuck on loading screen

**Solutions:**
1. **Clear app data and restart**
   ```bash
   # For iOS Simulator
   xcrun simctl uninstall booted <bundle-id>
   
   # For Android Emulator
   adb uninstall <package-name>
   ```

2. **Check Supabase configuration**
   - Verify your Supabase URL and anon key in `.env`
   - Ensure redirect URLs are configured in Supabase dashboard
   - Check that OAuth providers are enabled if using them

3. **Test on different platform**
   - Try on physical device instead of simulator
   - Test on web if available
   - Check if issue is platform-specific

### Issue 2: Sign Out Not Working

**Symptoms:**
- Button doesn't respond
- User stays logged in
- No navigation after sign out

**Solutions:**
1. **Check button implementation**
   - Ensure `onPress` is connected to `signOut` function
   - Verify no errors in console when clicking

2. **Clear AsyncStorage manually**
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   await AsyncStorage.clear();
   ```

3. **Force reload app**
   - Close and reopen the app
   - Clear app data from device settings

### Issue 3: Household Loading Stuck

**Symptoms:**
- Long loading after creating/joining household
- User profile not updated
- Stuck on onboarding screen

**Solutions:**
1. **Call refreshUserProfile after household operations**
   ```typescript
   const { refreshUserProfile } = useAuth();
   
   // After creating household
   await createHousehold(name, address);
   await refreshUserProfile(); // Add this
   ```

2. **Check database trigger**
   - Verify user profile is created in database
   - Check if household_id is updated correctly

3. **Add loading indicators**
   - Show loading overlay during operations
   - Provide feedback to user

### Issue 4: OAuth Not Working

**Symptoms:**
- OAuth button doesn't open browser
- Browser opens but doesn't redirect back
- "OAuth cancelled or failed" error

**Solutions:**
1. **Check OAuth configuration in Supabase**
   - Enable Google/Apple OAuth in Supabase dashboard
   - Add redirect URLs: `exp://localhost:8081`, `househld://`
   - Configure OAuth provider credentials

2. **Verify deep link configuration**
   ```json
   // app.json
   {
     "expo": {
       "scheme": "househld",
       "ios": {
         "bundleIdentifier": "com.yourcompany.househld"
       },
       "android": {
         "package": "com.yourcompany.househld"
       }
     }
   }
   ```

3. **Test OAuth flow**
   - Try on physical device (OAuth may not work in simulator)
   - Check console logs for OAuth errors
   - Verify WebBrowser is working: `WebBrowser.maybeCompleteAuthSession()`

### Issue 5: Email Confirmation Required

**Symptoms:**
- User signs up but can't log in
- "Email not confirmed" error
- No confirmation email received

**Solutions:**
1. **Check Supabase email settings**
   - Go to Authentication → Settings in Supabase dashboard
   - Check if "Enable email confirmations" is on/off
   - Verify email templates are configured

2. **Resend confirmation email**
   ```typescript
   const { resendConfirmationEmail } = useAuth();
   await resendConfirmationEmail(email);
   ```

3. **Disable email confirmation for testing**
   - In Supabase dashboard: Authentication → Settings
   - Turn off "Enable email confirmations"
   - Note: Not recommended for production

### Issue 6: Profile Not Loading

**Symptoms:**
- User is authenticated but profile is null
- "User profile not found" in console
- Retrying profile load multiple times

**Solutions:**
1. **Check database trigger**
   ```sql
   -- Verify trigger exists
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   
   -- Check if user exists in users table
   SELECT * FROM users WHERE id = 'user-id-here';
   ```

2. **Manually create profile**
   - The app will attempt this after 10 retries
   - Check console for "Profile created manually" message

3. **Check RLS policies**
   ```sql
   -- Verify user can read their own profile
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

### Issue 7: Infinite Loading

**Symptoms:**
- App stuck on loading screen
- isLoading never becomes false
- No error messages

**Solutions:**
1. **Check for infinite loops**
   - Look for useEffect dependencies causing re-renders
   - Verify no circular navigation redirects

2. **Add timeout protection**
   - Already implemented in updated AuthContext
   - Check console for "Profile load timeout" message

3. **Force stop loading**
   ```typescript
   // In AuthContext, manually set:
   setIsLoading(false);
   ```

## Debugging Tips

### Enable Verbose Logging

Add this to your code to see detailed auth flow:

```typescript
// In AuthContext.tsx
console.log('🔐 Auth State:', {
  isLoading,
  isAuthenticated,
  hasUser: !!user,
  userId: user?.id,
  householdId: user?.householdId,
});
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to Logs → Auth Logs
3. Look for failed authentication attempts
4. Check for rate limiting or errors

### Test Authentication Flow

```typescript
// Test sign up
const result = await signUp('test@example.com', 'password123', 'Test User', 'Adult');
console.log('Sign up result:', result);

// Test sign in
const result2 = await signIn('test@example.com', 'password123');
console.log('Sign in result:', result2);

// Test profile load
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

### Monitor Network Requests

Use React Native Debugger or Flipper to:
- Monitor Supabase API calls
- Check request/response payloads
- Identify failed requests

## Prevention Best Practices

1. **Always handle errors**
   ```typescript
   try {
     await someAuthOperation();
   } catch (error) {
     console.error('Auth error:', error);
     Alert.alert('Error', error.message);
   }
   ```

2. **Add loading states**
   ```typescript
   const [isLoading, setIsLoading] = useState(false);
   
   const handleAction = async () => {
     setIsLoading(true);
     try {
       await action();
     } finally {
       setIsLoading(false);
     }
   };
   ```

3. **Provide user feedback**
   - Show loading indicators
   - Display error messages
   - Confirm successful operations

4. **Test on multiple platforms**
   - iOS simulator and device
   - Android emulator and device
   - Web browser (if applicable)

5. **Keep dependencies updated**
   ```bash
   npm update @supabase/supabase-js
   npm update expo
   npm update expo-web-browser
   ```

## Getting Help

If you're still experiencing issues:

1. **Check the logs**
   - Console logs in your app
   - Supabase dashboard logs
   - Expo dev tools logs

2. **Search for similar issues**
   - Supabase GitHub issues
   - Expo forums
   - Stack Overflow

3. **Provide detailed information**
   - Platform (iOS/Android/Web)
   - Error messages
   - Steps to reproduce
   - Console logs

4. **Contact support**
   - Supabase support: support@supabase.io
   - Expo support: https://expo.dev/support
   - App support: support@househld.com
