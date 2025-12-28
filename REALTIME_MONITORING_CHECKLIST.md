
# Realtime Monitoring Checklist

## 🚀 Quick Health Check (Daily)

### Console Logs Check
```bash
# Look for these patterns in your app console:

✅ GOOD:
[REALTIME] Active channels: 5
[SUB] Tasks status: SUBSCRIBED
[REALTIME] Tasks update: INSERT

❌ BAD:
[REALTIME] Active channels: 15
[SUB] Tasks: Already subscribed (repeated many times)
CHANNEL_ERROR
```

### Supabase Dashboard Check
1. Go to: Dashboard → Database → Realtime
2. **Active Connections**: Should equal number of logged-in users
3. **Channels per Connection**: Should be exactly 5
4. **Realtime Queries**: Should be <1,000 per day

## 📊 Weekly Performance Review

### Week 1 Targets:
- [ ] Realtime queries: <5,000/day (down from 123,000)
- [ ] Database CPU: <20% (down from 90%)
- [ ] Active subscriptions: 5 per user
- [ ] No subscription errors in logs

### Week 2 Targets:
- [ ] Realtime queries: <1,000/day
- [ ] Database CPU: <10%
- [ ] Stable performance
- [ ] No memory leaks

### Week 4 Targets:
- [ ] Realtime queries: <500/day
- [ ] Database CPU: <5%
- [ ] Zero subscription leaks
- [ ] Optimal performance

## 🔍 What to Monitor

### 1. Subscription Count
**Check:** App console on startup
**Expected:** Exactly 5 subscriptions
**Alert if:** More than 5 or increasing over time

### 2. Cleanup Execution
**Check:** App console on sign out
**Expected:** "CLEANING UP ALL SUBSCRIPTIONS" message
**Alert if:** No cleanup message appears

### 3. Realtime Updates
**Check:** Add item on one device, see on another
**Expected:** Update appears within 1-2 seconds
**Alert if:** Updates delayed >5 seconds or not appearing

### 4. Database Load
**Check:** Supabase Dashboard → Performance
**Expected:** <10% CPU usage
**Alert if:** >20% CPU usage

### 5. Error Logs
**Check:** App console and Supabase logs
**Expected:** No CHANNEL_ERROR messages
**Alert if:** Repeated errors or connection failures

## 🚨 Alert Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Active Channels | 5 | 6-10 | >10 |
| Realtime Queries/Day | <1,000 | 1,000-5,000 | >5,000 |
| Database CPU | <10% | 10-30% | >30% |
| Update Latency | <2s | 2-5s | >5s |
| Subscription Errors | 0 | 1-5/day | >5/day |

## 📱 User Testing Checklist

### Test 1: Basic Functionality
1. [ ] Sign in to app
2. [ ] Check console shows 5 subscriptions
3. [ ] Navigate between tabs
4. [ ] Verify no new subscriptions created
5. [ ] Sign out
6. [ ] Verify cleanup logs appear

### Test 2: Realtime Updates
1. [ ] Open app on Device A
2. [ ] Open app on Device B (same household)
3. [ ] Add task on Device A
4. [ ] Verify task appears on Device B within 2 seconds
5. [ ] Repeat for shopping, events, polls

### Test 3: Household Switching
1. [ ] Sign in to Household A
2. [ ] Note subscription count (should be 5)
3. [ ] Switch to Household B
4. [ ] Verify old subscriptions cleaned up
5. [ ] Verify new subscriptions created (should be 5)
6. [ ] Check console for cleanup logs

### Test 4: Memory Leak Check
1. [ ] Open app
2. [ ] Navigate between all tabs 10 times
3. [ ] Check subscription count (should still be 5)
4. [ ] Sign out and sign in 5 times
5. [ ] Verify no subscription accumulation

## 🛠️ Troubleshooting Quick Fixes

### Issue: High subscription count
```bash
# Fix: Force close app and restart
# Check: Console should show only 5 subscriptions
```

### Issue: Updates not working
```bash
# Fix: Check Supabase Realtime is enabled
# Run in Supabase SQL Editor:
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table household_events;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table polls;
```

### Issue: Cleanup not happening
```bash
# Fix: Verify RealtimeProvider is wrapped correctly
# Check: app/_layout.tsx has <RealtimeProvider> around app
```

### Issue: Database still high load
```bash
# Fix: Wait 24 hours for old connections to timeout
# Check: Supabase Dashboard → Database → Connections
# Manually kill old connections if needed
```

## 📈 Success Metrics Dashboard

Create a simple spreadsheet to track:

| Date | Realtime Queries | DB CPU % | Active Subs | Errors | Notes |
|------|------------------|----------|-------------|--------|-------|
| Day 1 | 123,000 | 90% | 50+ | Many | Before fix |
| Day 2 | 15,000 | 45% | 5 | Few | After fix |
| Day 3 | 2,000 | 12% | 5 | None | Stabilizing |
| Day 7 | 800 | 5% | 5 | None | Optimal |

## ✅ Daily Checklist

**Morning Check (5 minutes):**
- [ ] Check Supabase Dashboard for any alerts
- [ ] Review realtime query count from yesterday
- [ ] Check database CPU usage
- [ ] Scan error logs for issues

**Evening Check (5 minutes):**
- [ ] Test app on one device
- [ ] Verify subscriptions = 5
- [ ] Test one realtime update
- [ ] Check cleanup on sign out

## 🎯 Monthly Review

**Questions to ask:**
1. Are realtime queries consistently <1,000/day?
2. Is database CPU consistently <10%?
3. Are users reporting any issues?
4. Are Supabase costs reduced?
5. Is app performance improved?

**If all YES:** Fix is successful! ✅
**If any NO:** Review logs and troubleshoot

## 📞 Escalation Path

**Level 1 - Self Check:**
- Review console logs
- Check this monitoring guide
- Verify Supabase settings

**Level 2 - Code Review:**
- Review RealtimeContext.tsx
- Check hook implementations
- Verify provider wrapping

**Level 3 - Support:**
- Gather console logs
- Export Supabase metrics
- Document specific issues
- Contact support with data

---

**Remember:** The goal is 5 subscriptions per user, <1,000 realtime queries per day, and <10% database CPU usage. Monitor daily for the first week, then weekly thereafter.
