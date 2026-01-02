
# HOUSEHLD Realtime Testing Checklist

## Pre-Testing Setup

1. **Clear App Data**
   - iOS: Delete app and reinstall
   - Android: Clear app data in settings
   - Expo Go: Shake device → Clear cache

2. **Check Console Logs**
   - Open React Native debugger
   - Watch for `[RealtimeProvider]` logs
   - Watch for `[Supabase]` logs

## Test 1: Create Task (Single User)

### Steps:
1. Log in to the app
2. Navigate to Tasks screen
3. Click "Add Task" button
4. Fill in task details
5. Click "Save"

### Expected Behavior:
- ✅ Task appears in list **immediately** (< 100ms)
- ✅ No loading spinner after save
- ✅ No duplicate task appears
- ✅ Console shows: `[useTasks] Task created successfully`
- ✅ Console shows: `[RealtimeProvider] Task already exists (optimistic), skipping`

### If It Fails:
- Check console for errors
- Verify JWT token is set: Look for `[RealtimeProvider] Setting realtime auth with access token`
- Verify channel is subscribed: Look for `[RealtimeProvider] ✅ Successfully subscribed`

## Test 2: Delete Task (Single User)

### Steps:
1. Create a task (if not already present)
2. Swipe left on task (or click delete button)
3. Confirm deletion

### Expected Behavior:
- ✅ Task disappears from list **immediately** (< 100ms)
- ✅ No loading spinner
- ✅ Task doesn't reappear
- ✅ Console shows: `[useTasks] Task deleted successfully`

### If It Fails:
- Check console for errors
- Verify optimistic delete is working
- Check if rollback occurred (task reappears)

## Test 3: Create Task (Multi-User)

### Setup:
- Device A: User 1 logged in
- Device B: User 2 logged in (same household)

### Steps:
1. On Device A: Create a new task
2. On Device B: Watch the tasks list

### Expected Behavior:
- ✅ Device A: Task appears immediately
- ✅ Device B: Task appears within 1-2 seconds
- ✅ No duplicate tasks on either device
- ✅ Both devices show same task list

### If It Fails:
- Check if both users are in the same household
- Verify realtime connection on Device B: Look for `[RealtimeProvider] ✅ Successfully subscribed`
- Check RLS policies allow both users to read broadcasts

## Test 4: Delete Task (Multi-User)

### Setup:
- Device A: User 1 logged in
- Device B: User 2 logged in (same household)

### Steps:
1. On Device A: Delete a task
2. On Device B: Watch the tasks list

### Expected Behavior:
- ✅ Device A: Task disappears immediately
- ✅ Device B: Task disappears within 1-2 seconds
- ✅ Task doesn't reappear on either device

### If It Fails:
- Check realtime connection on Device B
- Verify DELETE events are being broadcast
- Check console for `[RealtimeProvider] Processing DELETE for tasks`

## Test 5: Create Calendar Event

### Steps:
1. Navigate to Calendar screen
2. Click "Add Event" button
3. Fill in event details
4. Click "Save"

### Expected Behavior:
- ✅ Event appears in calendar **immediately**
- ✅ No duplicate event
- ✅ Console shows: `[useEvents] Event created successfully`

## Test 6: Delete Calendar Event

### Steps:
1. Open an existing event
2. Click "Delete" button
3. Confirm deletion

### Expected Behavior:
- ✅ Event disappears from calendar **immediately**
- ✅ Event doesn't reappear
- ✅ Console shows: `[useEvents] Event deleted successfully`

## Test 7: Add Shopping Item

### Steps:
1. Navigate to Shopping screen
2. Click "Add Item" button
3. Enter item name
4. Click "Add"

### Expected Behavior:
- ✅ Item appears in list **immediately**
- ✅ No duplicate item
- ✅ Console shows: `[useShoppingList] Item added successfully`

## Test 8: Delete Shopping Item

### Steps:
1. Swipe left on shopping item
2. Click "Delete"

### Expected Behavior:
- ✅ Item disappears **immediately**
- ✅ Item doesn't reappear
- ✅ Console shows: `[useShoppingList] Item deleted successfully`

## Test 9: Network Interruption

### Steps:
1. Enable Airplane Mode
2. Create a task
3. Disable Airplane Mode

### Expected Behavior:
- ✅ Task appears in UI immediately (optimistic)
- ✅ After network returns, task syncs to backend
- ✅ No duplicate task appears
- ✅ Realtime reconnects automatically

### If It Fails:
- Check if optimistic update is working
- Verify reconnection logic in console
- Look for `[Realtime] Reconnecting in ...ms`

## Test 10: Token Refresh

### Steps:
1. Log in to the app
2. Wait for token to expire (or force refresh)
3. Create a task

### Expected Behavior:
- ✅ Token refreshes automatically
- ✅ Realtime auth updates with new token
- ✅ Task creation still works
- ✅ Console shows: `[Supabase] Token refreshed, updating realtime auth`

## Test 11: Logout and Login

### Steps:
1. Create some tasks
2. Log out
3. Log back in

### Expected Behavior:
- ✅ All tasks are visible after login
- ✅ Realtime connection re-establishes
- ✅ New tasks can be created
- ✅ Console shows: `[RealtimeProvider] Setting up realtime for household`

## Test 12: Switch Household

### Steps:
1. Create a task in Household A
2. Switch to Household B
3. Create a task in Household B
4. Switch back to Household A

### Expected Behavior:
- ✅ Only Household A tasks visible in Household A
- ✅ Only Household B tasks visible in Household B
- ✅ No cross-household data leakage
- ✅ Realtime subscriptions recreate on household change

## Test 13: Rapid Create/Delete

### Steps:
1. Rapidly create 5 tasks in quick succession
2. Rapidly delete 3 tasks
3. Create 2 more tasks

### Expected Behavior:
- ✅ All operations complete successfully
- ✅ No duplicate tasks
- ✅ No missing tasks
- ✅ Final count is correct (4 tasks)

## Test 14: Concurrent Edits (Multi-User)

### Setup:
- Device A: User 1 logged in
- Device B: User 2 logged in (same household)

### Steps:
1. Both users create tasks simultaneously
2. Both users delete different tasks simultaneously

### Expected Behavior:
- ✅ All tasks appear on both devices
- ✅ All deletions reflect on both devices
- ✅ No conflicts or lost updates
- ✅ No duplicate tasks

## Test 15: App Background/Foreground

### Steps:
1. Create a task
2. Put app in background (home button)
3. Wait 30 seconds
4. Bring app to foreground
5. Create another task

### Expected Behavior:
- ✅ Realtime connection maintains or reconnects
- ✅ New task creation works
- ✅ No errors in console

## Console Log Checklist

### On App Start:
```
[Supabase] Auth state changed: SIGNED_IN
[Supabase] Session active for user: user@example.com
[RealtimeProvider] Setting up realtime for household: <uuid>
[RealtimeProvider] Setting realtime auth with access token
[RealtimeProvider] Creating broadcast channel: household:<uuid>
[RealtimeProvider] ✅ Successfully subscribed to realtime broadcast
[RealtimeProvider] Loaded X tasks
[RealtimeProvider] Loaded X shopping items
[RealtimeProvider] Loaded X events
```

### On Create Task:
```
[useTasks] Creating task: <title>
[useTasks] Task created successfully
[RealtimeProvider] INSERT event: {...}
[RealtimeProvider] Processing INSERT for tasks
[RealtimeProvider] Task already exists (optimistic), skipping: <id>
```

### On Delete Task:
```
[useTasks] Deleting task: <id>
[useTasks] Task deleted successfully
[RealtimeProvider] DELETE event: {...}
[RealtimeProvider] Processing DELETE for tasks
[RealtimeProvider] Deleting task: <id>
```

### On Token Refresh:
```
[Supabase] Auth state changed: TOKEN_REFRESHED
[Supabase] Token refreshed, updating realtime auth
[Supabase] Realtime auth updated with new token
```

## Error Scenarios to Watch For

### ❌ MalformedJWT Error (FIXED)
```
[RealtimeProvider] ❌ Channel error: Error: "MalformedJWT: The token provided is not a valid JWT"
```
**If you see this:** The fix was not applied correctly. Check that `setAuth()` is called with `session.access_token`, not `user.id`.

### ❌ No Access Token
```
[RealtimeProvider] No access token available
```
**If you see this:** Session is not available. Check auth state and ensure user is logged in.

### ❌ Channel Timeout
```
[RealtimeProvider] ⚠️ Channel timed out, will retry...
```
**If you see this:** Network issue or Supabase Realtime is down. Check internet connection.

### ❌ RLS Policy Violation
```
[useTasks] Error creating task: new row violates row-level security policy
```
**If you see this:** RLS policies are blocking the operation. Check household membership.

## Performance Benchmarks

### Target Metrics:
- **Optimistic Update**: < 100ms
- **Realtime Broadcast**: < 2 seconds
- **Initial Load**: < 3 seconds
- **Channel Subscribe**: < 1 second

### How to Measure:
1. Note timestamp before action
2. Note timestamp when UI updates
3. Calculate difference

Example:
```typescript
const start = Date.now();
await createTask(taskData);
const end = Date.now();
console.log(`Task creation took ${end - start}ms`);
```

## Final Verification

After completing all tests, verify:

- [ ] All create operations are instant
- [ ] All delete operations are instant
- [ ] No duplicates appear
- [ ] Multi-user sync works
- [ ] Network interruption is handled
- [ ] Token refresh works
- [ ] No MalformedJWT errors
- [ ] No memory leaks (check with React DevTools)
- [ ] Works in Expo Go
- [ ] Works in development build
- [ ] Works in production build

## Sign-Off

**Tester Name:** _______________

**Date:** _______________

**Environment:**
- [ ] Expo Go
- [ ] Development Build
- [ ] Production Build

**Platform:**
- [ ] iOS
- [ ] Android

**Result:**
- [ ] All tests passed
- [ ] Some tests failed (list below)

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
