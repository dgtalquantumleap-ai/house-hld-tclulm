
# Supabase Realtime Configuration Guide

## 🔧 Required Supabase Settings

### 1. Enable Realtime for Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable realtime for all required tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table household_events;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table polls;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

**Expected output:**
```
schemaname | tablename
-----------+------------------
public     | tasks
public     | shopping_items
public     | household_events
public     | notifications
public     | polls
```

### 2. Verify RLS Policies

Your tables should have RLS policies that allow reading:

```sql
-- Check RLS policies for tasks
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Check RLS policies for shopping_items
SELECT * FROM pg_policies WHERE tablename = 'shopping_items';

-- Check RLS policies for household_events
SELECT * FROM pg_policies WHERE tablename = 'household_events';

-- Check RLS policies for notifications
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Check RLS policies for polls
SELECT * FROM pg_policies WHERE tablename = 'polls';
```

**Required policies for each table:**
- SELECT policy for household members
- INSERT policy for household members
- UPDATE policy for household members
- DELETE policy for household admins

### 3. Check Realtime Settings

In Supabase Dashboard:

1. Go to **Database** → **Replication**
2. Verify these tables are listed:
   - ✅ tasks
   - ✅ shopping_items
   - ✅ household_events
   - ✅ notifications
   - ✅ polls

3. Go to **Settings** → **API**
4. Verify **Realtime** is enabled

### 4. Connection Limits

Check your Supabase plan limits:

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check max connections
SHOW max_connections;
```

**Recommended settings:**
- Free tier: 60 connections (sufficient for 10-12 users)
- Pro tier: 200+ connections (sufficient for 40+ users)

## 🔍 Troubleshooting Realtime Issues

### Issue: Realtime updates not working

**Check 1: Realtime enabled for table**
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'tasks';
```

If empty, run:
```sql
alter publication supabase_realtime add table tasks;
```

**Check 2: RLS policies allow SELECT**
```sql
-- Test as authenticated user
SET ROLE authenticated;
SELECT * FROM tasks LIMIT 1;
```

If error, add SELECT policy:
```sql
create policy "Users can view household tasks"
on tasks for select
using (household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
));
```

**Check 3: Subscription filter is correct**

In your app console, verify:
```
[SUB] Starting: household-tasks
Filter: household_id=eq.<your-household-id>
```

### Issue: Too many connections

**Check current connections:**
```sql
SELECT 
  datname,
  usename,
  application_name,
  state,
  count(*)
FROM pg_stat_activity
GROUP BY datname, usename, application_name, state
ORDER BY count(*) DESC;
```

**Kill idle connections:**
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '10 minutes';
```

### Issue: High database CPU

**Check slow queries:**
```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Optimize indexes:**
```sql
-- Add indexes for realtime filters
CREATE INDEX IF NOT EXISTS idx_tasks_household_id ON tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_household_id ON shopping_items(household_id);
CREATE INDEX IF NOT EXISTS idx_household_events_household_id ON household_events(household_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_household_id ON polls(household_id);
```

## 📊 Monitoring Queries

### Check Realtime Activity

```sql
-- Active realtime connections
SELECT 
  application_name,
  state,
  count(*)
FROM pg_stat_activity
WHERE application_name LIKE '%realtime%'
GROUP BY application_name, state;
```

### Check Table Activity

```sql
-- Recent changes to tasks table
SELECT 
  schemaname,
  relname,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE relname IN ('tasks', 'shopping_items', 'household_events', 'notifications', 'polls');
```

### Check Subscription Performance

```sql
-- Realtime publication stats
SELECT * FROM pg_stat_replication;
```

## 🎯 Optimal Configuration

### For Small Apps (<100 users):

```sql
-- Realtime settings
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Reload configuration
SELECT pg_reload_conf();
```

### For Medium Apps (100-1000 users):

```sql
-- Realtime settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';

-- Reload configuration
SELECT pg_reload_conf();
```

### For Large Apps (1000+ users):

Consider upgrading to Supabase Pro or Enterprise plan with:
- Dedicated resources
- Higher connection limits
- Better performance
- Priority support

## ✅ Configuration Checklist

Before deploying:

- [ ] Realtime enabled for all 5 tables
- [ ] RLS policies allow SELECT for household members
- [ ] Indexes created on household_id and user_id columns
- [ ] Connection limits appropriate for user count
- [ ] Realtime settings verified in dashboard
- [ ] Test realtime updates work in development
- [ ] Monitor database performance for 24 hours
- [ ] Verify no connection errors in logs

## 🚨 Common Mistakes

### Mistake 1: Forgetting to enable realtime
```sql
-- ❌ Wrong: Table exists but realtime not enabled
CREATE TABLE tasks (...);

-- ✅ Correct: Enable realtime after creating table
CREATE TABLE tasks (...);
alter publication supabase_realtime add table tasks;
```

### Mistake 2: RLS blocking realtime
```sql
-- ❌ Wrong: RLS enabled but no SELECT policy
alter table tasks enable row level security;

-- ✅ Correct: Add SELECT policy for household members
alter table tasks enable row level security;
create policy "Users can view household tasks"
on tasks for select
using (household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
));
```

### Mistake 3: Missing indexes
```sql
-- ❌ Wrong: No index on filter column
-- Realtime filter: household_id=eq.123
-- Query scans entire table

-- ✅ Correct: Index on filter column
CREATE INDEX idx_tasks_household_id ON tasks(household_id);
-- Query uses index, much faster
```

### Mistake 4: Too broad filters
```sql
-- ❌ Wrong: No filter, receives all changes
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'tasks'
}, handler)

-- ✅ Correct: Filter by household_id
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'tasks',
  filter: `household_id=eq.${householdId}`
}, handler)
```

## 📞 Support Resources

- **Supabase Realtime Docs:** https://supabase.com/docs/guides/realtime
- **Supabase Discord:** https://discord.supabase.com
- **Supabase Support:** support@supabase.io

## 🎉 Success Indicators

Your Supabase configuration is optimal when:

1. ✅ All 5 tables show in Replication tab
2. ✅ RLS policies allow household member access
3. ✅ Indexes exist on filter columns
4. ✅ Connection count < 80% of max
5. ✅ Database CPU < 10%
6. ✅ No realtime errors in logs
7. ✅ Updates appear within 1-2 seconds

---

**Last Updated:** 2024
**Status:** Ready for Production
