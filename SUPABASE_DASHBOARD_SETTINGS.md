
# Supabase Dashboard Configuration Recommendations

## Overview

This document provides specific configuration changes to make in the Supabase Dashboard to complement the code-level optimizations.

---

## 🔧 Required Configuration Changes

### 1. Database Connection Pool Settings

**Location:** Dashboard → Settings → Database → Connection Pooling

**Current Issue:** Auth connections set to absolute value (10)

**Recommended Change:**
```
Auth Connections: 10-15% (percentage-based)
```

**Why:**
- Percentage-based scaling adapts to load
- Prevents connection exhaustion
- Better resource utilization

**Steps:**
1. Go to Supabase Dashboard
2. Navigate to Settings → Database
3. Find "Connection Pooling" section
4. Change "Auth" from "10" to "10-15%"
5. Click "Save"

---

### 2. Realtime Settings (Optional - Phase 2)

**Location:** Dashboard → Project Settings → Realtime Settings

**Recommended Changes:**

#### A. Database Connection Pool Size
```
Current: Default
Recommended: Increase by 20-30%
```

**Why:**
- More concurrent realtime connections
- Better handling of multiple subscriptions
- Reduced connection timeouts

#### B. Enable Private-Only Channels (Future)
```
Current: Disabled
Recommended: Enable (after RLS policies added)
```

**Why:**
- Better security
- Enforces authentication
- Prevents unauthorized access

**Note:** Only enable after implementing RLS policies for `realtime.messages` table

---

### 3. Database Performance Settings

**Location:** Dashboard → Settings → Database → Performance

#### A. Statement Timeout
```
Current: Default (likely 60s)
Recommended: 30s
```

**Why:**
- Prevents long-running queries
- Forces query optimization
- Better resource management

#### B. Idle Transaction Timeout
```
Current: Default
Recommended: 10 minutes
```

**Why:**
- Cleans up idle connections
- Frees up resources
- Prevents connection leaks

---

### 4. API Settings

**Location:** Dashboard → Settings → API

#### A. Max Rows
```
Current: Default (1000)
Recommended: Keep at 1000 or reduce to 500
```

**Why:**
- Prevents large payload transfers
- Forces pagination
- Better performance

#### B. Enable RLS
```
Current: Enabled ✅
Recommended: Keep enabled
```

**Why:**
- Security
- Data isolation
- Proper authorization

---

## 📊 Monitoring & Alerts

### 1. Enable Query Performance Insights

**Location:** Dashboard → Database → Query Performance

**Recommended:**
- Enable query performance tracking
- Set up alerts for slow queries (>1s)
- Monitor top queries weekly

**Steps:**
1. Go to Database → Query Performance
2. Enable "Track query performance"
3. Set alert threshold: 1000ms
4. Add email notification

---

### 2. Set Up Database Alerts

**Location:** Dashboard → Settings → Alerts

**Recommended Alerts:**

#### A. High CPU Usage
```
Threshold: 80%
Duration: 5 minutes
Action: Email notification
```

#### B. High Connection Count
```
Threshold: 90% of max connections
Duration: 2 minutes
Action: Email notification
```

#### C. Slow Queries
```
Threshold: >1000ms
Count: >10 in 5 minutes
Action: Email notification
```

---

## 🔍 Monitoring Dashboard

### Key Metrics to Watch

**Location:** Dashboard → Database → Reports

**Monitor Weekly:**

1. **Query Performance**
   - Top 10 slowest queries
   - Query count trends
   - Average query time

2. **Connection Usage**
   - Active connections
   - Idle connections
   - Connection pool utilization

3. **Realtime Usage**
   - Active channels
   - Message throughput
   - Connection errors

4. **Database Size**
   - Table sizes
   - Index sizes
   - Growth trends

---

## 🎯 Expected Results After Configuration

### Before Optimization
```
- Realtime queries: 38,433 calls, 201.6s
- Timezone queries: 122 calls, 19s
- Connection pool: Fixed at 10
- No query monitoring
```

### After Optimization
```
- Realtime queries: ~10,000 calls, ~50s (75% reduction)
- Timezone queries: 0 calls, 0s (100% elimination)
- Connection pool: Dynamic 10-15%
- Active query monitoring
```

---

## 📋 Configuration Checklist

### Immediate Actions (Do Now)

- [ ] Change Auth connections to 10-15% (percentage)
- [ ] Set statement timeout to 30s
- [ ] Enable query performance tracking
- [ ] Set up slow query alerts (>1s)
- [ ] Set up high CPU alert (>80%)
- [ ] Set up connection count alert (>90%)

### Phase 2 Actions (After RLS Policies)

- [ ] Enable private-only channels in Realtime
- [ ] Increase realtime connection pool by 20-30%
- [ ] Review and optimize RLS policies
- [ ] Set up realtime-specific alerts

### Ongoing Monitoring

- [ ] Review query performance weekly
- [ ] Check connection pool usage daily
- [ ] Monitor realtime metrics weekly
- [ ] Review database size monthly

---

## 🔧 Advanced Configuration (Optional)

### 1. Enable Connection Pooler

**Location:** Dashboard → Settings → Database → Connection Pooling

**Mode:** Transaction Mode

**Why:**
- Better connection reuse
- Lower overhead
- Supports more concurrent users

**Note:** Test thoroughly before enabling in production

---

### 2. Optimize Realtime Broadcast

**Location:** Dashboard → Project Settings → Realtime

**Settings:**
```
Max Connections: Increase by 30%
Max Channels per Connection: 100 (default)
Heartbeat Interval: 30s (matches client config)
```

---

### 3. Database Extensions

**Location:** Dashboard → Database → Extensions

**Recommended Extensions:**
- `pg_stat_statements` - Query performance tracking (should be enabled)
- `pg_trgm` - Text search optimization (if using search)

---

## 📊 Verification Steps

### After Making Changes

1. **Check Connection Pool:**
   ```sql
   SELECT count(*) as active_connections 
   FROM pg_stat_activity 
   WHERE state = 'active';
   ```

2. **Verify Query Performance:**
   - Go to Database → Query Performance
   - Check if slow queries are being tracked
   - Verify alerts are configured

3. **Monitor Realtime:**
   - Go to Realtime → Logs
   - Check for connection errors
   - Verify channel subscriptions

4. **Test Application:**
   - Open app and perform common actions
   - Check console logs for cache hits
   - Verify realtime updates work
   - Confirm no connection errors

---

## 🐛 Troubleshooting

### Connection Pool Issues

**Symptom:** "Too many connections" errors

**Solutions:**
1. Increase connection pool percentage
2. Check for connection leaks in code
3. Enable idle transaction timeout
4. Review long-running queries

### Slow Queries

**Symptom:** Queries taking >1s

**Solutions:**
1. Check query performance dashboard
2. Add missing indexes
3. Optimize RLS policies
4. Review query patterns

### Realtime Issues

**Symptom:** Subscriptions not working

**Solutions:**
1. Check realtime logs
2. Verify connection pool has capacity
3. Check RLS policies
4. Review client configuration

---

## 📚 Additional Resources

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [Realtime Settings Guide](https://supabase.com/docs/guides/realtime/settings)
- [Query Performance Optimization](https://supabase.com/docs/guides/database/query-performance)

---

## ✅ Summary

**Critical Changes:**
1. ✅ Auth connections: 10-15% (percentage)
2. ✅ Statement timeout: 30s
3. ✅ Enable query performance tracking
4. ✅ Set up alerts for slow queries and high CPU

**Expected Impact:**
- Better connection management
- Proactive issue detection
- Improved query performance
- Better resource utilization

**Next Steps:**
1. Make the configuration changes
2. Monitor for 24-48 hours
3. Review metrics and adjust as needed
4. Proceed with Phase 2 optimizations if needed

---

**Questions?** Check the Supabase documentation or review the performance optimization guide.
