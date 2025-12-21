
# Quick Fix Reference - HouseHLD Auth Issues

## 🚨 Critical Fixes Applied

### 1. Cross-Origin Error Fix
**Location:** `contexts/AuthContext.tsx`

**What was fixed:**
- Added timeout protection to prevent hanging
- Added platform-specific OAuth handling
- Improved error handling in `loadUserProfile`

**Key code:**
```typescript
// Timeout protection
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Profile load timeout')), 10000);
});

const { data, error } = await Promise.race([
  loadPromise,
  timeoutPromise
]) as any;
```

### 2. Platform Detection Fix
**Location:** `lib/supabase.ts`

**What was fixed:**
- Added platform-specific storage configuration
- Enabled `detectSessionInUrl` only for web
- Added PKCE flow for better security

**Key code:**
```typescript
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
```

### 3. Navigation Error Handling
**Location:** `app/(auth)/_layout.tsx`

**What was fixed:**
- Added try-catch blocks around navigation
- Added loading indicator
- Improved error logging

**Key code:**
```typescript
try {
  router.replace('/(tabs)/(home)');
} catch (error) {
  console.error('AuthLayout: Error navigating:', error);
}
```

## 📋 Testing Checklist

### Must Test
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign out (should work immediately)
- [ ] Create household (should complete in <3s)
- [ ] Join household (should complete in <3s)
- [ ] No cross-origin errors in console
- [ ] No infinite loading states

### Platform Testing
- [ ] iOS device
- [ ] Android device
- [ ] iOS simulator
- [ ] Android emulator

### Edge Cases
- [ ] Sign out while loading
- [ ] Network error during auth
- [ ] Invalid credentials
- [ ] Email already exists
- [ ] Weak password

## 🔧 Quick Fixes for Common Issues

### Issue: Sign Out Not Working
```typescript
// In contexts/AuthContext.tsx
const signOut = async () => {
  setUser(null); // Clear FIRST
  await supabase.auth.signOut();
};
```

### Issue: Household Loading Stuck
```typescript
// In app/(auth)/onboarding.tsx
const { refreshUserProfile } = useAuth();

await createHousehold(name, address);
await refreshUserProfile(); // Add this line
```

### Issue: Cross-Origin Error
```typescript
// In lib/supabase.ts
detectSessionInUrl: Platform.OS === 'web', // Only for web
```

### Issue: OAuth Not Working
```typescript
// Platform-specific handling in AuthContext
if (Platform.OS === 'web') {
  // Use standard flow
} else {
  // Use WebBrowser
}
```

## 🎯 Key Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `contexts/AuthContext.tsx` | Added timeout + error handling | Prevents hanging, better errors |
| `lib/supabase.ts` | Platform-specific config | Fixes cross-origin issues |
| `app/(auth)/_layout.tsx` | Navigation error handling | Prevents navigation crashes |
| `app/_layout.tsx` | Platform logging | Better debugging |

## 🚀 Deployment Checklist

Before deploying:
- [ ] All tests pass
- [ ] No console errors
- [ ] Tested on physical devices
- [ ] OAuth configured in Supabase
- [ ] Environment variables set
- [ ] Email templates configured
- [ ] RLS policies verified
- [ ] Database triggers working

## 📱 Environment Setup

### Required Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=https://tkavowbmakdnqekweoro.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Supabase Dashboard Settings
1. **Authentication → Settings**
   - Enable/disable email confirmation
   - Configure OAuth providers
   - Add redirect URLs

2. **Authentication → URL Configuration**
   - Add: `exp://localhost:8081`
   - Add: `househld://`
   - Add: Your production URL

3. **Database → Triggers**
   - Verify `on_auth_user_created` exists
   - Check trigger function is working

## 🐛 Debug Commands

### Check Auth State
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### Check User Profile
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
console.log('Profile:', data, error);
```

### Clear Storage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

### Test OAuth
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
console.log('OAuth:', data, error);
```

## 📞 Support

If issues persist:
1. Check console logs
2. Review Supabase dashboard logs
3. Test on different platform
4. Clear app data and retry
5. Contact support with logs

## ✅ Success Criteria

Your app is working correctly when:
- ✅ Sign up completes in <2s
- ✅ Sign in completes in <2s
- ✅ Sign out works immediately
- ✅ Household creation completes in <3s
- ✅ No cross-origin errors
- ✅ No infinite loading
- ✅ Navigation works smoothly
- ✅ Profile loads correctly
- ✅ OAuth works (if enabled)
- ✅ All console logs are clean

## 🎉 You're Done!

If all tests pass, your HouseHLD app is ready for:
- Beta testing
- App store submission
- Production deployment

Remember to:
- Monitor error logs
- Collect user feedback
- Keep dependencies updated
- Test regularly on devices
