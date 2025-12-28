
# Quick Start: Realtime Performance Fix

## 🚀 5-Minute Setup Guide

### Step 1: Verify Files (30 seconds)

Check these files exist and are updated:
- ✅ `contexts/RealtimeContext.tsx` - Centralized subscriptions
- ✅ `app/_layout.tsx` - Provider wrapping
- ✅ `hooks/useTasks.ts` - Event listeners
- ✅ `hooks/useShoppingList.ts` - Event listeners
- ✅ `hooks/useEvents.ts` - Event listeners
- ✅ `hooks/useNotifications.ts` - Event listeners
- ✅ `hooks/usePolls.ts` - Event listeners

### Step 2: Enable Realtime in Supabase (2 minutes)

Open Supabase SQL Editor and run:

```sql
-- Enable realtime for all tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table household_events;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table polls;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_household_id ON tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_household_id ON shopping_items(household_id);
CREATE INDEX IF NOT EXISTS idx_household_events_household_id ON household_events(household_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_household_id ON polls(household_id);
```

### Step 3: Test the App (2 minutes)

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Check console logs:**
   ```
   [REALTIME] Initializing centralized subscriptions
   [SUB] Tasks status: SUBSCRIBED
   [SUB] Shopping status: SUBSCRIBED
   [SUB] Events status: SUBSCRIBED
   [SUB] Notifications status: SUBSCRIBED
   [SUB] Polls status: SUBSCRIBED
   [REALTIME] Active channels: 5
   ```

3. **Test realtime update:**
   - Open app on two devices
   - Add a task on Device 1
   - Verify it appears on Device 2 within 2 seconds

4. **Test cleanup:**
   - Sign out
   - Check console shows:
   ```
   [REALTIME] CLEANING UP ALL SUBSCRIPTIONS
   [UNSUB] Removing channel: tasks
   [UNSUB] Removing channel: shopping
   [UNSUB] Removing channel: events
   [UNSUB] Removing channel: notifications
   [UNSUB] Removing channel: polls
   ```

### Step 4: Monitor Results (30 seconds)

Go to Supabase Dashboard → Database → Realtime

**Check:**
- Active Connections: 1 per logged-in user
- Channels per Connection: 5
- Realtime Queries: Should start dropping immediately

## ✅ Success Checklist

- [ ] Console shows exactly 5 subscriptions
- [ ] Cleanup logs appear on sign out
- [ ] Realtime updates work correctly
- [ ] No CHANNEL_ERROR messages
- [ ] Database CPU drops below 20% within 1 hour
- [ ] Realtime queries drop by 80% within 24 hours

## 🎯 Expected Results

### Immediate (within 1 hour):
- ✅ Subscription count: 5 per user
- ✅ No subscription leaks
- ✅ App feels more responsive

### Short-term (within 24 hours):
- ✅ Realtime queries: Down 80%
- ✅ Database CPU: Down 50%
- ✅ No connection errors

### Long-term (within 1 week):
- ✅ Realtime queries: Down 95%+
- ✅ Database CPU: <10%
- ✅ Supabase costs: Significantly reduced

## 🚨 Troubleshooting

### Issue: More than 5 subscriptions

**Fix:**
1. Force close app
2. Clear app cache
3. Restart app
4. Check console logs

### Issue: Realtime updates not working

**Fix:**
1. Verify Supabase realtime is enabled (Step 2)
2. Check RLS policies allow SELECT
3. Verify household_id is correct in logs

### Issue: Cleanup not happening

**Fix:**
1. Verify `RealtimeProvider` is wrapped in `app/_layout.tsx`
2. Check console for any errors
3. Ensure `useEffect` cleanup is not being blocked

## 📊 Monitoring Dashboard

Create a simple tracking sheet:

| Metric | Before | Target | Current |
|--------|--------|--------|---------|
| Realtime Queries/Day | 123,000 | <1,000 | ? |
| Database CPU | 90% | <10% | ? |
| Active Subscriptions | 50+ | 5 | ? |
| App Performance | Slow | Fast | ? |

Update "Current" column daily for first week.

## 📚 Additional Resources

- **Full Verification Guide:** `REALTIME_FIX_VERIFICATION.md`
- **Monitoring Checklist:** `REALTIME_MONITORING_CHECKLIST.md`
- **Supabase Config:** `SUPABASE_REALTIME_CONFIG.md`
- **Implementation Summary:** `REALTIME_FIX_SUMMARY.md`

## 🎉 You're Done!

If you see:
- ✅ 5 subscriptions in console
- ✅ Cleanup logs on sign out
- ✅ Realtime updates working
- ✅ No errors in logs

**The fix is working correctly!** 🎊

Monitor for 24 hours and you should see dramatic improvements in database performance and Supabase costs.

---

**Need Help?** Check the troubleshooting guides or contact support with your console logs.
