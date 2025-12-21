
# HouseHLD App Troubleshooting Guide

## Common Issues and Solutions

### 1. Cross-Origin Frame Error

**Symptoms:**
- Error: "Blocked a frame with origin... from accessing a cross-origin frame"
- App hangs on loading screen
- Authentication doesn't complete

**Solutions:**

#### A. Clear Expo Cache
```bash
# Stop the dev server
# Then run:
npx expo start -c
```

#### B. Check Supabase Configuration
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your development URLs to "Redirect URLs":
   - `http://localhost:19006` (for web)
   - `exp://localhost:19000` (for Expo Go)
   - Your custom scheme if using development builds

#### C. Verify Platform-Specific Code
The fixes ensure platform-specific handling. If issues persist:
- Check `lib/supabase.ts` - ensure `detectSessionInUrl` is only enabled for web
- Check `contexts/AuthContext.tsx` - ensure OAuth uses WebBrowser only on native

### 2. HTTP 500 Error (Expo CLI)

**Symptoms:**
- Error: "CommandError: Input is required, but 'npx expo' is in non-interactive mode"
- Error: "Use the EXPO_TOKEN environment variable to authenticate"

**Solutions:**

#### A. For Local Development
```bash
# Login to Expo
npx expo login

# Follow the prompts to authenticate
# Your token will be stored automatically
```

#### B. For CI/CD Environments
```bash
# Get your token
npx expo whoami

# Set environment variable
export EXPO_TOKEN=your_token_here

# Or add to your CI configuration
# GitHub Actions example:
# - name: Setup Expo
#   env:
#     EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### 3. Sign Out Not Working

**Symptoms:**
- Button doesn't respond
- User stays logged in
- No navigation after sign out

**Solutions:**

✅ **Already Fixed** - The latest code clears user state immediately

If still experiencing issues:
1. Check console logs for errors
2. Verify `signOut` function is being called
3. Clear app data and try again

### 4. Infinite Loading After Household Creation

**Symptoms:**
- Loading spinner never stops
- App hangs after creating/joining household
- No navigation to home screen

**Solutions:**

✅ **Already Fixed** - Added `refreshUserProfile` call after household operations

If still experiencing issues:
1. Check console logs for profile loading errors
2. Verify household was created in Supabase dashboard
3. Check user's `household_id` field is updated

### 5. Profile Not Loading

**Symptoms:**
- User is authenticated but profile data is missing
- App shows loading indefinitely
- Console shows "Profile not found" errors

**Solutions:**

#### A. Check Database Trigger
Verify the trigger exists in Supabase:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- If missing, create it:
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### B. Manual Profile Creation
If trigger isn't working, the code will attempt manual creation after 10 retries.
Check console logs for "attempting manual creation" message.

### 6. OAuth Not Working

**Symptoms:**
- OAuth buttons don't work
- Browser doesn't open
- Authentication fails after OAuth

**Solutions:**

#### A. Check Supabase OAuth Configuration
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google/Apple OAuth
3. Configure OAuth credentials
4. Add redirect URLs

#### B. For Native Apps
Ensure URL scheme is configured in `app.json`:
```json
{
  "expo": {
    "scheme": "househld"
  }
}
```

#### C. For Web
Ensure redirect URL matches your development URL:
- Development: `http://localhost:19006`
- Production: Your production domain

### 7. TypeScript Errors

**Symptoms:**
- Red squiggly lines in editor
- Build fails with type errors

**Solutions:**

```bash
# Check for TypeScript errors
npx tsc --noEmit

# If errors persist, try:
rm -rf node_modules
npm install
npx tsc --noEmit
```

### 8. App Crashes on Startup

**Symptoms:**
- App crashes immediately
- Red screen error
- "Unable to resolve module" errors

**Solutions:**

#### A. Clear All Caches
```bash
# Clear Expo cache
npx expo start -c

# Clear Metro bundler cache
rm -rf .expo
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### B. Check Environment Variables
Verify `.env` file exists with:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 9. Realtime Not Working

**Symptoms:**
- Changes don't sync across devices
- No real-time updates
- Console shows connection errors

**Solutions:**

#### A. Check Supabase Realtime
1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for your tables
3. Check realtime logs in dashboard

#### B. Check Connection
```typescript
// Add to your code temporarily for debugging
supabase.channel('test')
  .on('presence', { event: 'sync' }, () => {
    console.log('Realtime connected!');
  })
  .subscribe();
```

### 10. Navigation Issues

**Symptoms:**
- Wrong screen shows up
- Navigation loops
- Can't navigate back

**Solutions:**

#### A. Check Auth State
```typescript
// Add logging to see auth state
console.log('Auth state:', {
  isAuthenticated,
  hasHousehold: !!user?.householdId,
  currentRoute: segments.join('/')
});
```

#### B. Clear Navigation State
```bash
# Restart app with clean state
npx expo start -c
```

## Debug Mode

Enable detailed logging by adding to your code:

```typescript
// In AuthContext.tsx
console.log('🔐 Auth Debug:', {
  user: user?.email,
  isLoading,
  isAuthenticated,
  householdId: user?.householdId
});

// In navigation
console.log('🧭 Navigation Debug:', {
  segments: segments.join('/'),
  isAuthenticated,
  hasHousehold: !!user?.householdId
});
```

## Getting Help

If none of these solutions work:

1. **Check Console Logs**
   - Look for specific error messages
   - Note the file and line number
   - Check the call stack

2. **Check Supabase Dashboard**
   - Verify data is being created
   - Check auth logs
   - Review realtime logs

3. **Test on Different Platforms**
   - Try iOS, Android, and Web
   - Issues may be platform-specific

4. **Verify Environment**
   - Node version: 18+
   - Expo SDK: 54
   - React Native: 0.81.4

5. **Create Minimal Reproduction**
   - Isolate the issue
   - Test with minimal code
   - Document steps to reproduce

## Quick Fixes Checklist

- [ ] Clear Expo cache: `npx expo start -c`
- [ ] Reinstall dependencies: `rm -rf node_modules && npm install`
- [ ] Check environment variables in `.env`
- [ ] Verify Supabase configuration in dashboard
- [ ] Check console logs for specific errors
- [ ] Test on different platform (iOS/Android/Web)
- [ ] Verify database triggers exist
- [ ] Check RLS policies are correct
- [ ] Ensure OAuth is configured (if using)
- [ ] Clear app data on device

## Prevention

To avoid these issues in the future:

1. **Always use error boundaries**
2. **Add comprehensive logging**
3. **Test on all platforms**
4. **Keep dependencies updated**
5. **Monitor Supabase logs**
6. **Use TypeScript strictly**
7. **Write tests for critical flows**
8. **Document configuration changes**

## Success Indicators

Your app is working correctly when:

✅ No errors in console
✅ Sign up/in works smoothly
✅ Profile loads in < 3 seconds
✅ Navigation is instant
✅ Sign out works immediately
✅ Realtime updates work
✅ All platforms work (iOS/Android/Web)
✅ No infinite loading states
