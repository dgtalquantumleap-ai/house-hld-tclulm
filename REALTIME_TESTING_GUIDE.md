
# Realtime System Testing Guide

## 🧪 Quick Test Procedure

### Prerequisites
- Two devices or browser windows
- Both logged into the same household
- Console logs visible (for debugging)

### Test 1: Create Task (Single User)
1. Open the Tasks screen
2. Click "Add Task" button
3. Fill in task details
4. Click "Save"

**Expected Result:**
- ✅ Task appears instantly in the list
- ✅ No loading spinner or delay
- ✅ Console shows: "useTasks: Task created successfully"

### Test 2: Create Task (Multi-User)
1. **Device A:** Open Tasks screen
2. **Device B:** Open Tasks screen
3. **Device A:** Create a new task
4. **Device B:** Watch the task list

**Expected Result:**
- ✅ Device A: Task appears instantly
- ✅ Device B: Task appears within 1 second
- ✅ No duplicates on either device
- ✅ Console shows broadcast event received

### Test 3: Delete Task (Single User)
1. Open the Tasks screen
2. Swipe to delete a task (or click delete button)
3. Confirm deletion

**Expected Result:**
- ✅ Task disappears instantly from the list
- ✅ No loading spinner or delay
- ✅ Console shows: "useTasks: Task deleted successfully"

### Test 4: Delete Task (Multi-User)
1. **Device A:** Open Tasks screen
2. **Device B:** Open Tasks screen
3. **Device A:** Delete a task
4. **Device B:** Watch the task list

**Expected Result:**
- ✅ Device A: Task disappears instantly
- ✅ Device B: Task disappears within 1 second
- ✅ No errors on either device

### Test 5: Update Task (Single User)
1. Open the Tasks screen
2. Click on a task to edit
3. Change the title or status
4. Save changes

**Expected Result:**
- ✅ Changes appear instantly in the list
- ✅ No loading spinner or delay
- ✅ Console shows: "useTasks: Task updated successfully"

### Test 6: Update Task (Multi-User)
1. **Device A:** Open Tasks screen
2. **Device B:** Open Tasks screen
3. **Device A:** Update a task (e.g., mark as completed)
4. **Device B:** Watch the task list

**Expected Result:**
- ✅ Device A: Changes appear instantly
- ✅ Device B: Changes appear within 1 second
- ✅ Both devices show the same data

### Test 7: Network Interruption
1. Open the Tasks screen
2. Turn off WiFi/mobile data
3. Create a task (will fail)
4. Turn WiFi/mobile data back on
5. Wait a few seconds

**Expected Result:**
- ✅ App shows error message when offline
- ✅ Optimistic update is rolled back
- ✅ Connection automatically restored
- ✅ Console shows: "Reconnecting..."

### Test 8: Rapid Operations
1. Open the Tasks screen
2. Quickly create 5 tasks in a row
3. Quickly delete 3 tasks
4. Quickly update 2 tasks

**Expected Result:**
- ✅ All operations complete successfully
- ✅ No duplicates appear
- ✅ Final state is consistent
- ✅ No errors in console

## 📊 Console Log Verification

### On App Start
```
[RealtimeProvider] Setting up realtime for household: {id}
[RealtimeProvider] Loading all data for household: {id}
[RealtimeProvider] Loaded X tasks
[RealtimeProvider] Creating broadcast channel: household:{id}
[RealtimeProvider] Channel status: SUBSCRIBED
[RealtimeProvider] ✅ Successfully subscribed to realtime broadcast
```

### On Create
```
useTasks: Creating task: {title}
[RealtimeProvider] INSERT event: {...}
[RealtimeProvider] Processing INSERT for tasks
[RealtimeProvider] Task already exists (optimistic), skipping: {id}
useTasks: Task created successfully
```

### On Update
```
useTasks: Updating task: {id}
[RealtimeProvider] UPDATE event: {...}
[RealtimeProvider] Processing UPDATE for tasks
[RealtimeProvider] Updating task: {id}
useTasks: Task updated successfully
```

### On Delete
```
useTasks: Deleting task: {id}
[RealtimeProvider] DELETE event: {...}
[RealtimeProvider] Processing DELETE for tasks
[RealtimeProvider] Deleting task: {id}
useTasks: Task deleted successfully
```

## 🚨 Red Flags

### Issues to Report
- ❌ Changes take more than 1 second to appear
- ❌ Duplicate items appear in lists
- ❌ "Channel error" or "CHANNEL_ERROR" in console
- ❌ "Not connected to realtime" messages
- ❌ App crashes on create/update/delete
- ❌ Changes don't sync between devices

### If You See These
1. Take a screenshot of the console logs
2. Note the exact steps to reproduce
3. Check Supabase dashboard for errors
4. Report to the development team

## 🎯 Performance Benchmarks

### Expected Latencies
- **Optimistic Update:** < 50ms
- **Database Insert:** < 200ms
- **Broadcast Received:** < 500ms
- **Total Time to Sync:** < 1 second

### How to Measure
1. Open browser console
2. Note timestamp before action
3. Note timestamp when broadcast received
4. Calculate difference

Example:
```javascript
const start = Date.now();
await createTask({ title: 'Test' });
// Wait for broadcast
const end = Date.now();
console.log('Total time:', end - start, 'ms');
```

## 🔍 Advanced Testing

### Test 9: Concurrent Updates
1. **Device A:** Open task details
2. **Device B:** Open same task details
3. **Device A:** Update task title
4. **Device B:** Update task status
5. Both save at the same time

**Expected Result:**
- ✅ Both updates succeed
- ✅ Final state includes both changes
- ✅ No data loss

### Test 10: Large Dataset
1. Create 100 tasks
2. Scroll through the list
3. Create a new task
4. Delete a task

**Expected Result:**
- ✅ Smooth scrolling
- ✅ Operations still instant
- ✅ No performance degradation

### Test 11: Background/Foreground
1. Open the app
2. Put app in background (home button)
3. Wait 30 seconds
4. Bring app to foreground
5. Create a task

**Expected Result:**
- ✅ Connection automatically restored
- ✅ Operations work normally
- ✅ No errors

### Test 12: Different Entities
Repeat Tests 1-6 for:
- [ ] Tasks
- [ ] Calendar Events
- [ ] Shopping Items
- [ ] Meals
- [ ] Polls

**Expected Result:**
- ✅ All entities work the same way
- ✅ Consistent behavior across all screens

## 📝 Test Report Template

```markdown
## Test Report

**Date:** _________________
**Tester:** _________________
**Platform:** iOS / Android / Web
**Device:** _________________

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| Create Task (Single) | ✅ / ❌ | |
| Create Task (Multi) | ✅ / ❌ | |
| Delete Task (Single) | ✅ / ❌ | |
| Delete Task (Multi) | ✅ / ❌ | |
| Update Task (Single) | ✅ / ❌ | |
| Update Task (Multi) | ✅ / ❌ | |
| Network Interruption | ✅ / ❌ | |
| Rapid Operations | ✅ / ❌ | |

### Performance Metrics

- Optimistic Update: _____ ms
- Broadcast Received: _____ ms
- Total Sync Time: _____ ms

### Issues Found

1. _________________
2. _________________
3. _________________

### Console Logs

```
[Paste relevant console logs here]
```

### Screenshots

[Attach screenshots if applicable]

### Recommendation

- [ ] Ready for production
- [ ] Needs fixes
- [ ] Needs more testing

**Signature:** _________________
```

## 🎉 Success Criteria

### All Tests Must Pass
- ✅ Single user operations instant
- ✅ Multi-user sync < 1 second
- ✅ No duplicates
- ✅ No crashes
- ✅ Automatic reconnection works
- ✅ Consistent across all entities

### Performance Must Meet Benchmarks
- ✅ Optimistic update < 50ms
- ✅ Broadcast received < 500ms
- ✅ Total sync time < 1 second

### User Experience Must Be Excellent
- ✅ No manual refresh needed
- ✅ No logout/login needed
- ✅ Smooth animations
- ✅ Clear error messages

## 📞 Support

If you encounter issues during testing:
1. Check console logs
2. Review `REALTIME_QUICK_REFERENCE.md`
3. Check Supabase dashboard
4. Contact development team

## ✨ Conclusion

This testing guide ensures the realtime system works correctly across all scenarios. Complete all tests before deploying to production.

**Happy Testing! 🚀**
