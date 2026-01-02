
# Realtime System Troubleshooting Guide

## 🔍 Quick Diagnostics

### Check Connection Status
```typescript
import { useRealtimeData } from '@/contexts/RealtimeProvider';

const { isConnected, connectionStatus } = useRealtimeData();
console.log('Connected:', isConnected);
console.log('Status:', connectionStatus);
```

**Expected:** `isConnected: true`, `connectionStatus: 'connected'`

### Check Active Channels
```typescript
import { checkRealtimeConnection } from '@/lib/supabase';

checkRealtimeConnection();
```

**Expected:** One channel with state `'joined'` or `'subscribed'`

## 🚨 Common Issues

### Issue 1: Changes Not Appearing

**Symptoms:**
- Create/update/delete operations don't update UI
- Changes appear after refresh
- Console shows no broadcast events

**Diagnosis:**
```typescript
// Check connection
const { isConnected, connectionStatus } = useRealtimeData();
console.log('Connected:', isConnected, 'Status:', connectionStatus);

// Check household ID
const { user } = useAuth();
console.log('Household ID:', user?.householdId);
```

**Solutions:**

1. **Not Connected**
   ```typescript
   // Check console for connection errors
   // Look for: "Channel status: CHANNEL_ERROR"
   
   // Try manual reconnection
   import { reconnectRealtime } from '@/lib/supabase';
   await reconnectRealtime();
   ```

2. **No Household ID**
   ```typescript
   // User must belong to a household
   // Check user.household_id in database
   // If null, user needs to create or join a household
   ```

3. **RLS Policy Issue**
   ```sql
   -- Check if user can access realtime.messages
   SELECT * FROM realtime.messages 
   WHERE topic = 'household:YOUR_HOUSEHOLD_ID'
   LIMIT 1;
   
   -- If error, check RLS policies
   SELECT * FROM pg_policies 
   WHERE schemaname = 'realtime' 
   AND tablename = 'messages';
   ```

### Issue 2: Duplicate Items Appearing

**Symptoms:**
- Same item appears multiple times in list
- Items duplicate after create operation
- Console shows multiple INSERT events

**Diagnosis:**
```typescript
// Check for duplicate subscriptions
import { supabase } from '@/lib/supabase';
const channels = supabase.getChannels();
console.log('Active channels:', channels.length);
// Should be 1 per household
```

**Solutions:**

1. **Multiple Subscriptions**
   ```typescript
   // RealtimeProvider should prevent this
   // Check if RealtimeProvider is mounted multiple times
   // Ensure only one <RealtimeProvider> in app tree
   ```

2. **Optimistic Update Not Preventing Duplicates**
   ```typescript
   // Check duplicate prevention logic
   case 'INSERT':
     if (prev.some(t => t.id === newRecord.id)) {
       console.log('Already exists, skipping');
       return prev; // This should prevent duplicates
     }
     return [newRecord, ...prev];
   ```

### Issue 3: Slow Updates

**Symptoms:**
- Changes take > 1 second to appear
- Broadcast events delayed
- Console shows slow response times

**Diagnosis:**
```typescript
// Measure latency
const start = Date.now();
await createTask({ title: 'Test' });
// Wait for broadcast
const end = Date.now();
console.log('Latency:', end - start, 'ms');
```

**Solutions:**

1. **Network Issues**
   ```typescript
   // Check network connection
   import NetInfo from '@react-native-community/netinfo';
   const state = await NetInfo.fetch();
   console.log('Network:', state.type, state.isConnected);
   ```

2. **Database Performance**
   ```sql
   -- Check for missing indexes
   SELECT * FROM pg_indexes 
   WHERE tablename IN ('tasks', 'shopping_items', 'household_events', 'meals', 'polls');
   
   -- Check for slow queries
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%tasks%' 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

3. **Too Many Channels**
   ```typescript
   // Should only have 1 channel per household
   const channels = supabase.getChannels();
   if (channels.length > 1) {
     console.warn('Too many channels:', channels.length);
     // Clean up extra channels
     channels.forEach(ch => supabase.removeChannel(ch));
   }
   ```

### Issue 4: Connection Errors

**Symptoms:**
- Console shows "CHANNEL_ERROR"
- Connection status is 'error'
- Frequent disconnections

**Diagnosis:**
```typescript
// Check error logs
// Look for specific error messages in console
```

**Solutions:**

1. **Authentication Error**
   ```typescript
   // Ensure user is authenticated
   const { data: { session } } = await supabase.auth.getSession();
   if (!session) {
     console.error('No active session');
     // User needs to log in again
   }
   
   // Refresh auth token
   await supabase.realtime.setAuth(session?.access_token);
   ```

2. **RLS Policy Violation**
   ```sql
   -- Check RLS policies
   SELECT * FROM pg_policies 
   WHERE schemaname = 'realtime' 
   AND tablename = 'messages';
   
   -- Test policy manually
   SET ROLE authenticated;
   SET request.jwt.claims.sub = 'USER_ID';
   SELECT * FROM realtime.messages 
   WHERE topic = 'household:HOUSEHOLD_ID';
   ```

3. **Supabase Service Issue**
   ```
   // Check Supabase status page
   // https://status.supabase.com
   
   // Check project health in dashboard
   // Dashboard > Project Settings > General
   ```

### Issue 5: Optimistic Update Not Rolling Back

**Symptoms:**
- Failed operations leave stale data in UI
- Deleted items reappear
- UI shows incorrect state

**Diagnosis:**
```typescript
// Check error handling in hooks
// Look for rollback logic in catch blocks
```

**Solutions:**

1. **Missing Rollback Logic**
   ```typescript
   // Ensure rollback is implemented
   try {
     // Optimistic update
     setItems(prev => [...prev, newItem]);
     
     // Database operation
     const { error } = await supabase.from('items').insert(newItem);
     
     if (error) {
       // Rollback
       setItems(prev => prev.filter(i => i.id !== newItem.id));
       throw error;
     }
   } catch (error) {
     console.error('Error:', error);
     // Ensure rollback happened
   }
   ```

### Issue 6: Memory Leaks

**Symptoms:**
- App becomes slow over time
- Memory usage increases
- Channels not cleaned up

**Diagnosis:**
```typescript
// Check for memory leaks
const channels = supabase.getChannels();
console.log('Active channels:', channels.length);
// Should not increase over time
```

**Solutions:**

1. **Channels Not Cleaned Up**
   ```typescript
   // Ensure cleanup in useEffect
   useEffect(() => {
     // Setup
     const channel = setupChannel();
     
     // Cleanup
     return () => {
       supabase.removeChannel(channel);
     };
   }, [dependency]);
   ```

2. **Multiple RealtimeProviders**
   ```typescript
   // Ensure only one RealtimeProvider in app
   // Check app/_layout.tsx
   // Should only wrap app once
   ```

## 🔧 Advanced Diagnostics

### Check Database Triggers
```sql
-- Verify triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('tasks', 'shopping_items', 'household_events', 'meals', 'polls')
  AND trigger_name LIKE '%broadcast%';

-- Should return 15 rows (3 per table: INSERT, UPDATE, DELETE)
```

### Check Broadcast Function
```sql
-- Verify function exists and uses realtime.broadcast_changes
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'broadcast_table_changes';

-- Should contain 'realtime.broadcast_changes'
```

### Check RLS Policies
```sql
-- Verify RLS policies on realtime.messages
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'realtime' 
  AND tablename = 'messages';

-- Should return 2 policies: read and send
```

### Test Broadcast Manually
```sql
-- Test broadcast function manually
INSERT INTO tasks (
  household_id,
  title,
  description,
  frequency,
  status,
  created_by_user_id
) VALUES (
  'YOUR_HOUSEHOLD_ID',
  'Test Task',
  'Testing broadcast',
  'one-time',
  'pending',
  'YOUR_USER_ID'
);

-- Check if broadcast was sent
-- Should see event in client console
```

## 📊 Monitoring

### Key Metrics to Monitor
1. **Connection Status** - Should be 'connected'
2. **Active Channels** - Should be 1 per household
3. **Broadcast Latency** - Should be < 500ms
4. **Error Rate** - Should be < 1%
5. **Reconnection Rate** - Should be low

### Logging
```typescript
// Enable detailed logging
import { supabase } from '@/lib/supabase';

// Already enabled in development
// Check console for:
// - [RealtimeProvider] logs
// - [Realtime] logs
// - [Supabase] logs
```

### Supabase Dashboard
1. Navigate to Dashboard > Logs > Realtime
2. Check for errors or warnings
3. Monitor connection count
4. Check broadcast events

## 🆘 Emergency Procedures

### If Nothing Works

1. **Clear App Data**
   ```typescript
   // Clear AsyncStorage
   import AsyncStorage from '@react-native-async-storage/async-storage';
   await AsyncStorage.clear();
   
   // Restart app
   ```

2. **Verify Database State**
   ```sql
   -- Check if data exists
   SELECT * FROM tasks WHERE household_id = 'YOUR_HOUSEHOLD_ID';
   
   -- Check if triggers are active
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'tasks';
   ```

3. **Check Supabase Project Health**
   - Dashboard > Project Settings > General
   - Check project status
   - Check database status
   - Check realtime status

4. **Contact Support**
   - Collect console logs
   - Collect Supabase logs
   - Note exact steps to reproduce
   - Contact development team

## 📞 Getting Help

### Information to Provide
1. **Console Logs** - Full logs from app start to error
2. **Connection Status** - isConnected, connectionStatus
3. **User Info** - user.id, user.householdId
4. **Steps to Reproduce** - Exact steps that cause the issue
5. **Platform** - iOS, Android, Web, Expo Go
6. **Supabase Logs** - From dashboard

### Where to Get Help
1. Check `REALTIME_QUICK_REFERENCE.md`
2. Check `REALTIME_FIX_COMPLETE.md`
3. Check Supabase documentation
4. Contact development team

## ✅ Verification Checklist

After fixing an issue, verify:
- [ ] Connection status is 'connected'
- [ ] Create operation updates UI instantly
- [ ] Update operation updates UI instantly
- [ ] Delete operation updates UI instantly
- [ ] Multi-user sync works
- [ ] No duplicates appear
- [ ] No errors in console
- [ ] Performance is acceptable

## 🎉 Conclusion

Most issues can be resolved by:
1. Checking connection status
2. Verifying household ID
3. Ensuring RLS policies are correct
4. Cleaning up duplicate channels
5. Restarting the app

If issues persist, collect logs and contact the development team.

**Good luck! 🚀**
