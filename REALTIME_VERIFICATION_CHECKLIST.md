
# Realtime Fix Verification Checklist

## ✅ Pre-Deployment Verification

### Database Layer
- [x] Database triggers updated to use `realtime.broadcast_changes()`
- [x] Triggers exist for all tables: tasks, shopping_items, household_events, meals, polls
- [x] RLS policies created on `realtime.messages` table
- [x] RLS policies allow household members to read broadcasts
- [x] RLS policies allow household members to send broadcasts
- [x] Index created on `users.household_id` for performance

### Client Layer
- [x] RealtimeProvider migrated from `postgres_changes` to `broadcast`
- [x] Channel uses `private: true` configuration
- [x] Channel uses correct topic format: `household:{household_id}`
- [x] Auth set before subscribing: `supabase.realtime.setAuth()`
- [x] Event handlers for INSERT, UPDATE, DELETE
- [x] Duplicate prevention logic implemented
- [x] Proper cleanup on unmount

### Hooks Layer
- [x] Optimistic updates implemented in all hooks
- [x] Rollback logic on errors
- [x] Proper error handling
- [x] State synchronization with RealtimeProvider

## 🧪 Testing Checklist

### Single User Testing
- [ ] Create task → appears instantly in UI
- [ ] Update task → updates instantly in UI
- [ ] Delete task → removed instantly from UI
- [ ] Create event → appears instantly in UI
- [ ] Delete event → removed instantly from UI
- [ ] Create shopping item → appears instantly in UI
- [ ] Delete shopping item → removed instantly from UI
- [ ] Create meal → appears instantly in UI
- [ ] Delete meal → removed instantly from UI
- [ ] No manual refresh required
- [ ] No logout/login required

### Multi-User Testing
- [ ] User A creates task → User B sees it instantly
- [ ] User A updates task → User B sees update instantly
- [ ] User A deletes task → User B sees deletion instantly
- [ ] User A creates event → User B sees it instantly
- [ ] User A deletes event → User B sees deletion instantly
- [ ] No duplicates appear
- [ ] Changes sync across all devices

### Error Scenarios
- [ ] Network interruption → automatic reconnection
- [ ] Database error → optimistic update rolled back
- [ ] RLS policy violation → error logged, no crash
- [ ] Invalid data → error handled gracefully

### Performance Testing
- [ ] Create latency < 50ms (optimistic)
- [ ] Broadcast received < 500ms
- [ ] No memory leaks
- [ ] No excessive re-renders
- [ ] Smooth scrolling with large lists

### Platform Testing
- [ ] Works in Expo Go (iOS)
- [ ] Works in Expo Go (Android)
- [ ] Works in development build (iOS)
- [ ] Works in development build (Android)
- [ ] Works in production build (iOS)
- [ ] Works in production build (Android)

## 🔍 Console Verification

### Expected Logs on App Start
```
[RealtimeProvider] Setting up realtime for household: {household_id}
[RealtimeProvider] Loading all data for household: {household_id}
[RealtimeProvider] Loaded X tasks
[RealtimeProvider] Loaded X shopping items
[RealtimeProvider] Loaded X events
[RealtimeProvider] Loaded X meals
[RealtimeProvider] Loaded X polls
[RealtimeProvider] Creating broadcast channel: household:{household_id}
[RealtimeProvider] Channel status: SUBSCRIBED
[RealtimeProvider] ✅ Successfully subscribed to realtime broadcast
```

### Expected Logs on Create
```
useTasks: Creating task: {title}
[RealtimeProvider] INSERT event: {...}
[RealtimeProvider] Processing INSERT for tasks
[RealtimeProvider] Task already exists (optimistic), skipping: {id}
useTasks: Task created successfully
```

### Expected Logs on Update
```
useTasks: Updating task: {id}
[RealtimeProvider] UPDATE event: {...}
[RealtimeProvider] Processing UPDATE for tasks
[RealtimeProvider] Updating task: {id}
useTasks: Task updated successfully
```

### Expected Logs on Delete
```
useTasks: Deleting task: {id}
[RealtimeProvider] DELETE event: {...}
[RealtimeProvider] Processing DELETE for tasks
[RealtimeProvider] Deleting task: {id}
useTasks: Task deleted successfully
```

## 🚨 Red Flags

### Issues to Watch For
- ❌ "Channel error" or "CHANNEL_ERROR" status
- ❌ "Not connected to realtime" messages
- ❌ Duplicate items appearing in lists
- ❌ Changes not appearing after 1 second
- ❌ "RLS policy violation" errors
- ❌ Memory leaks or excessive re-renders
- ❌ App crashes on create/update/delete

### If You See These
1. Check console logs for detailed error messages
2. Verify user has valid household_id
3. Check Supabase dashboard for realtime metrics
4. Verify database triggers are active
5. Check RLS policies are enabled

## 📊 Supabase Dashboard Checks

### Database
- [ ] Navigate to Database → Triggers
- [ ] Verify triggers exist for all tables
- [ ] Verify triggers use `broadcast_table_changes()` function

### Realtime
- [ ] Navigate to Logs → Realtime
- [ ] Verify broadcasts are being sent
- [ ] Check for any error messages
- [ ] Monitor connection count

### RLS Policies
- [ ] Navigate to Database → Tables → realtime.messages
- [ ] Verify RLS is enabled
- [ ] Verify policies exist for SELECT and INSERT
- [ ] Test policies with SQL editor

## 🎯 Success Criteria

### Must Have
- ✅ Create/update/delete operations update UI instantly
- ✅ Changes sync across all devices in < 1 second
- ✅ No duplicates appear
- ✅ No manual refresh required
- ✅ No logout/login required
- ✅ Works in Expo Go and production builds
- ✅ No crashes or errors

### Nice to Have
- ✅ Broadcast latency < 200ms
- ✅ Optimistic update latency < 50ms
- ✅ Smooth animations during updates
- ✅ Proper loading states
- ✅ Helpful error messages

## 📝 Sign-Off

### Development Team
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Console logs verified
- [ ] Performance acceptable
- [ ] No regressions found

### QA Team
- [ ] Manual testing completed
- [ ] Multi-user testing completed
- [ ] Error scenarios tested
- [ ] Platform testing completed
- [ ] Performance testing completed

### Product Team
- [ ] User experience verified
- [ ] No UX regressions
- [ ] Feature works as expected
- [ ] Ready for production

## 🚀 Deployment

### Pre-Deployment
- [ ] All checklist items completed
- [ ] All tests passing
- [ ] Code merged to main branch
- [ ] Database migration applied
- [ ] Documentation updated

### Post-Deployment
- [ ] Monitor Supabase dashboard for errors
- [ ] Monitor user feedback
- [ ] Check analytics for usage patterns
- [ ] Verify no increase in error rates
- [ ] Confirm performance metrics

## 📞 Rollback Plan

### If Issues Occur
1. Check Supabase dashboard for errors
2. Review console logs from affected users
3. Verify database triggers are active
4. Check RLS policies are correct
5. If critical issue, rollback migration:
   ```sql
   -- Rollback to pg_notify if needed
   -- (Not recommended, but available as emergency fallback)
   ```

## 🎉 Completion

Once all items are checked:
- ✅ Realtime system is working correctly
- ✅ UI updates are instant
- ✅ Multi-user sync is working
- ✅ No regressions introduced
- ✅ Ready for production

**Date Completed:** _________________

**Verified By:** _________________

**Notes:** _________________
