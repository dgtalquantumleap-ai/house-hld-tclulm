
# Quick Fix Commands - HouseHLD App

## 🚨 Emergency Fixes

### App Won't Start
```bash
# Nuclear option - fixes 90% of issues
npx expo start -c
rm -rf node_modules .expo
npm install
npx expo start
```

### Cross-Origin Errors
```bash
# Clear cache and restart
npx expo start -c
```

### TypeScript Errors
```bash
# Check for errors
npx tsc --noEmit

# Fix if needed
rm -rf node_modules
npm install
```

### Expo CLI Error (HTTP 500)
```bash
# Login to Expo
npx expo login

# Verify login
npx expo whoami
```

## 🔧 Common Development Commands

### Start Development Server
```bash
# Standard start
npm run dev

# With cache clear
npx expo start -c

# iOS only
npm run ios

# Android only
npm run android

# Web only
npm run web
```

### Database Operations

#### Check Tables
```bash
# Use Supabase dashboard or run SQL:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

#### Check User Profile
```sql
-- In Supabase SQL Editor
SELECT * FROM users WHERE email = 'your@email.com';
```

#### Check Household
```sql
-- In Supabase SQL Editor
SELECT * FROM households WHERE id = 'household_id';
```

#### Verify Trigger Exists
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Clear App Data

#### iOS Simulator
```bash
# Reset simulator
xcrun simctl erase all

# Or in simulator: Device → Erase All Content and Settings
```

#### Android Emulator
```bash
# Clear app data
adb shell pm clear com.yourapp.name

# Or in emulator: Settings → Apps → Your App → Clear Data
```

#### Expo Go
```bash
# Just uninstall and reinstall Expo Go app
```

## 🐛 Debugging Commands

### View Logs
```bash
# All logs
npx expo start

# iOS logs only
npx react-native log-ios

# Android logs only
npx react-native log-android
```

### Check Environment
```bash
# Node version (should be 18+)
node --version

# npm version
npm --version

# Expo version
npx expo --version

# Check Expo config
npx expo config
```

### Network Debugging
```bash
# Check if Supabase is reachable
curl https://tkavowbmakdnqekweoro.supabase.co

# Test with your anon key
curl -H "apikey: YOUR_ANON_KEY" \
  https://tkavowbmakdnqekweoro.supabase.co/rest/v1/
```

## 📱 Platform-Specific

### iOS
```bash
# Install pods (if using bare workflow)
cd ios && pod install && cd ..

# Clean build
cd ios && xcodebuild clean && cd ..

# Open in Xcode
open ios/YourApp.xcworkspace
```

### Android
```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Open in Android Studio
open -a "Android Studio" android/
```

### Web
```bash
# Build for web
npm run build:web

# Serve locally
npx serve web-build
```

## 🔐 Authentication Fixes

### Reset Auth State
```typescript
// Add to your code temporarily
await supabase.auth.signOut();
await AsyncStorage.clear(); // Clear all storage
// Then restart app
```

### Check Auth Session
```typescript
// Add to your code temporarily
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

### Resend Confirmation Email
```typescript
// In your app or via Supabase dashboard
await supabase.auth.resend({
  type: 'signup',
  email: 'user@email.com'
});
```

## 🗄️ Database Fixes

### Recreate User Profile Trigger
```sql
-- Run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'Adult')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Check RLS Policies
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'users';
SELECT * FROM pg_policies WHERE tablename = 'households';
```

### Enable RLS (if disabled)
```sql
-- Run in Supabase SQL Editor
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
```

## 🔄 Realtime Fixes

### Enable Realtime for Table
```sql
-- Run in Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE households;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

### Test Realtime Connection
```typescript
// Add to your code temporarily
const channel = supabase.channel('test');
channel
  .on('presence', { event: 'sync' }, () => {
    console.log('✅ Realtime connected!');
  })
  .subscribe((status) => {
    console.log('Realtime status:', status);
  });
```

## 📦 Dependency Issues

### Update Dependencies
```bash
# Update all dependencies
npm update

# Update specific package
npm install @supabase/supabase-js@latest

# Check for outdated packages
npm outdated
```

### Fix Peer Dependencies
```bash
# Install with legacy peer deps
npm install --legacy-peer-deps

# Or force
npm install --force
```

## 🎯 Quick Tests

### Test Auth Flow
```bash
# 1. Clear cache
npx expo start -c

# 2. Sign up new user
# 3. Check console logs
# 4. Verify profile created in Supabase
# 5. Sign out
# 6. Sign in again
```

### Test Navigation
```bash
# 1. Start app
# 2. Should show welcome screen
# 3. Sign in
# 4. Should show onboarding (if no household)
# 5. Create household
# 6. Should show home screen
# 7. Sign out
# 8. Should show welcome screen
```

## 💾 Backup Commands

### Export Database Schema
```bash
# Use Supabase CLI
supabase db dump -f schema.sql

# Or from dashboard: Database → Backups
```

### Export Data
```sql
-- Run in Supabase SQL Editor
COPY (SELECT * FROM users) TO '/tmp/users.csv' CSV HEADER;
```

## 🚀 Production Checklist

Before deploying:
```bash
# 1. Run TypeScript check
npx tsc --noEmit

# 2. Run linter
npm run lint

# 3. TestThe ErrorBoundary looks good. Now let's create a comprehensive summary document explaining the fixes:

<write file="CROSS_ORIGIN_FIX_SUMMARY.md">
# Cross-Origin Error Fix Summary

## Issues Identified

### 1. Cross-Origin Frame Error
**Error Message:** "Blocked a frame with origin 'https://2i1o0qg-anonymous-8081.exp.direct' from accessing a cross-origin frame"

**Root Cause:** 
- The `loadUserProfile` function in `AuthContext.tsx` was being called during initialization without proper error handling
- OAuth flows were not properly handling platform differences (web vs native)
- Session detection in URL was enabled for all platforms, causing issues on native

### 2. HTTP 500 Error
**Error Message:** "CommandError: Input is required, but 'npx expo' is in non-interactive mode"

**Root Cause:**
- This is an Expo CLI configuration issue when running in non-interactive mode
- The EXPO_TOKEN environment variable was not set

## Fixes Applied

### 1. Enhanced Error Handling in AuthContext

**File:** `contexts/AuthContext.tsx`

**Changes:**
- Added try-catch blocks around all async operations in initialization
- Added timeout protection (10 seconds) to prevent hanging on profile load
- Improved error logging throughout the authentication flow
- Added platform-specific handling for OAuth flows
- Separated web and native OAuth implementations

**Key Improvements:**
```typescript
// Added timeout to prevent hanging
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Profile load timeout')), 10000);
});

const { data, error } = await Promise.race([
  loadPromise,
  timeoutPromise
]) as any;
```

```typescript
// Platform-specific OAuth handling
if (Platform.OS === 'web') {
  // Use standard OAuth flow for web
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
} else {
  // Use WebBrowser for native platforms
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUrl
  );
}
```

### 2. Updated Supabase Client Configuration

**File:** `lib/supabase.ts`

**Changes:**
- Added platform-specific storage configuration
- Enabled `detectSessionInUrl` only for web platform
- Added PKCE flow for better security
- Added platform information to headers for debugging

**Key Improvements:**
```typescript
// Use different storage based on platform
const storage = Platform.OS === 'web' 
  ? undefined // Use default localStorage on web
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Only detect session in URL on web
    flowType: 'pkce', // Use PKCE flow for better security
  },
  // ... rest of config
});
```

### 3. Improved Auth Layout Error Handling

**File:** `app/(auth)/_layout.tsx`

**Changes:**
- Added try-catch blocks around all navigation calls
- Added loading indicator while auth state is being determined
- Improved error logging

### 4. Enhanced Root Layout

**File:** `app/_layout.tsx`

**Changes:**
- Added platform logging for debugging
- Improved error boundary integration

## Testing Checklist

### Authentication Flow
- [ ] Sign up with email/password works
- [ ] Sign in with email/password works
- [ ] Sign out works immediately
- [ ] OAuth with Google works (if enabled)
- [ ] OAuth with Apple works (if enabled)
- [ ] Profile loads correctly after authentication
- [ ] No cross-origin errors in console

### Platform-Specific Testing
- [ ] iOS: All auth flows work
- [ ] Android: All auth flows work
- [ ] Web: All auth flows work (if applicable)

### Error Handling
- [ ] No infinite loading states
- [ ] Errors are logged clearly in console
- [ ] User sees appropriate error messages
- [ ] App doesn't crash on auth errors

### Navigation
- [ ] Authenticated users with household → Home
- [ ] Authenticated users without household → Onboarding
- [ ] Unauthenticated users → Welcome screen
- [ ] No navigation loops

## Additional Recommendations

### 1. Set EXPO_TOKEN for CI/CD
If you're running the app in a CI/CD environment, set the EXPO_TOKEN:

```bash
# Get your token
npx expo login

# Set it in your environment
export EXPO_TOKEN=your_token_here
```

### 2. Monitor Logs
Watch the console logs for these key messages:
- "AuthContext: Initializing auth state"
- "AuthContext: User profile loaded successfully"
- "AuthContext: Auth state changed"

### 3. Supabase Dashboard Settings
Ensure your Supabase project has:
- Email confirmation enabled/disabled as desired
- OAuth providers configured correctly
- Redirect URLs added for your app

### 4. Deep Link Configuration
Ensure your `app.json` has the correct scheme:

```json
{
  "expo": {
    "scheme": "househld"
  }
}
```

## Known Limitations

1. **Web Platform**: OAuth flows on web will redirect the entire page, which is expected behavior
2. **Email Confirmation**: If email confirmation is required, users won't be automatically signed in after signup
3. **Profile Creation**: There's a small delay (up to 20 seconds with retries) for profile creation via database trigger

## Support

If you continue to experience issues:

1. Check the console logs for detailed error messages
2. Verify your Supabase configuration
3. Ensure all environment variables are set correctly
4. Test on a physical device (not just simulator/emulator)
5. Clear app data and try again

## Summary

The main fixes address:
- ✅ Cross-origin frame errors by adding proper error handling and platform detection
- ✅ Timeout issues by adding timeout protection to async operations
- ✅ OAuth flow issues by separating web and native implementations
- ✅ Navigation issues by adding try-catch blocks and better state management
- ✅ Loading states by adding proper loading indicators

The app should now handle authentication flows smoothly across all platforms without cross-origin errors or hanging states.
