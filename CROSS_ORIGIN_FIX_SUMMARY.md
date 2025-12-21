
# Cross-Origin Error Fix Summary

## Issues Identified

### 1. Cross-Origin Frame Error
**Error Message:** "Blocked a frame with origin 'https://2i1o0qg-anonymous-8081.exp.direct' from accessing a cross-origin frame"

**Root Cause:** 
- The `loadUserProfile` function in `AuthContext.tsx` was being called during initialization without proper error handling
- OAuth flows on web platform were not properly configured
- Missing platform-specific handling for web vs native

### 2. HTTP 500 Error
**Error Message:** "CommandError: Input is required, but 'npx expo' is in non-interactive mode"

**Root Cause:**
- This is an Expo CLI configuration issue, not a code issue
- Occurs when running Expo in CI/CD or non-interactive environments without EXPO_TOKEN

## Fixes Implemented

### 1. Enhanced AuthContext Error Handling

**File:** `contexts/AuthContext.tsx`

**Changes:**
- Added try-catch blocks around all async operations in initialization
- Added timeout protection (10 seconds) to prevent hanging on profile load
- Added platform-specific OAuth handling (web vs native)
- Improved error logging throughout
- Added proper cleanup of timeouts and subscriptions
- Made deep link handling conditional (only on native platforms)

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

// Platform-specific OAuth
if (Platform.OS === 'web') {
  // Use standard OAuth flow for web
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
} else {
  // Use WebBrowser for native
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUrl
  );
}
```

### 2. Updated Supabase Client Configuration

**File:** `lib/supabase.ts`

**Changes:**
- Added platform detection
- Use different storage based on platform (localStorage for web, AsyncStorage for native)
- Enable `detectSessionInUrl` only on web platform
- Use PKCE flow for better security
- Added platform information to headers for debugging

**Key Improvements:**
```typescript
const storage = Platform.OS === 'web' 
  ? undefined // Use default localStorage on web
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    detectSessionInUrl: Platform.OS === 'web', // Only on web
    flowType: 'pkce', // Better security
  },
});
```

### 3. Improved Auth Layout Error Handling

**File:** `app/(auth)/_layout.tsx`

**Changes:**
- Added try-catch blocks around navigation calls
- Added loading indicator while auth state is being determined
- Better error logging

### 4. Enhanced Root Layout

**File:** `app/_layout.tsx`

**Changes:**
- Added platform logging for debugging
- Better error boundary integration

## Testing Checklist

### Authentication Flow
- [ ] Sign up with email/password works
- [ ] Sign in with email/password works
- [ ] Sign out works immediately
- [ ] OAuth with Google works (if enabled)
- [ ] OAuth with Apple works (if enabled)
- [ ] Profile loads correctly after sign in
- [ ] No cross-origin errors in console

### Platform-Specific
- [ ] iOS: All auth flows work
- [ ] Android: All auth flows work
- [ ] Web: All auth flows work (if applicable)

### Error Handling
- [ ] No infinite loading states
- [ ] Errors are logged clearly
- [ ] User sees appropriate error messages
- [ ] App doesn't crash on auth errors

### Navigation
- [ ] Authenticated users with household → Home
- [ ] Authenticated users without household → Onboarding
- [ ] Unauthenticated users → Welcome screen
- [ ] No navigation loops

## HTTP 500 Error (Expo CLI)

This error is **not a code issue** but an environment configuration issue.

**Solution:**
1. Run `npx expo login` in your terminal
2. Follow the prompts to authenticate
3. Set the `EXPO_TOKEN` environment variable in your CI/CD environment
4. For local development, the token is stored automatically after login

**For CI/CD:**
```bash
# Get your token
npx expo whoami

# Set in your CI environment
export EXPO_TOKEN=your_token_here
```

## Verification Steps

1. **Clear all caches:**
   ```bash
   npx expo start -c
   ```

2. **Test sign up flow:**
   - Create new account
   - Verify no cross-origin errors
   - Check profile loads correctly

3. **Test sign in flow:**
   - Sign in with existing account
   - Verify immediate navigation
   - Check no hanging states

4. **Test sign out:**
   - Sign out
   - Verify immediate UI update
   - Check navigation to welcome screen

5. **Check console logs:**
   - No cross-origin errors
   - No unhandled promise rejections
   - Clear error messages if any issues

## Additional Notes

### Cross-Origin Issues on Web
If you're still experiencing cross-origin issues on web:

1. Check Supabase dashboard → Authentication → URL Configuration
2. Ensure your development URL is in the allowed redirect URLs
3. For Expo web, add: `http://localhost:19006`
4. For production, add your production domain

### OAuth Configuration
If OAuth is not working:

1. Check Supabase dashboard → Authentication → Providers
2. Ensure Google/Apple OAuth is enabled
3. Configure redirect URLs correctly
4. For native apps, ensure URL schemes are configured in `app.json`

### Performance
The fixes include:
- Timeout protection to prevent hanging
- Better error recovery
- Reduced unnecessary profile reloads
- Optimized auth state management

## Success Criteria

✅ No cross-origin errors in console
✅ Sign out works on first click
✅ Profile loads in < 3 seconds
✅ Proper navigation flow
✅ Clear loading states
✅ No infinite loops
✅ Platform-specific handling works
✅ Error messages are user-friendly

## Support

If issues persist:
1. Check the console logs for specific error messages
2. Verify Supabase configuration in dashboard
3. Ensure all environment variables are set correctly
4. Test on different platforms (iOS, Android, Web)
5. Clear all caches and restart dev server
