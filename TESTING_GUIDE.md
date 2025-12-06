
# HouseHLD App - Testing Guide

## Quick Test Scenarios

### 1. Test Signup Flow (CRITICAL - RECENTLY FIXED)

**Objective:** Verify that signup creates both auth account and user profile

**Steps:**
1. Open app and navigate to signup screen
2. Enter test credentials:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Sign Up"
4. Verify success alert appears
5. Check email for verification link
6. Click verification link
7. Return to app and sign in

**Expected Results:**
- ✅ Success alert: "Account Created! 🎉"
- ✅ Email verification message sent
- ✅ User profile created in `public.users` table
- ✅ User can sign in after email verification

**Database Verification:**
```sql
-- Check if user profile was created
SELECT id, name, email, role, household_id 
FROM public.users 
WHERE email = 'test@example.com';

-- Should return one row with:
-- - id: UUID matching auth.users.id
-- - name: "Test User"
-- - email: "test@example.com"
-- - role: "Adult"
-- - household_id: NULL (until they join/create household)
```

---

### 2. Test Profile Loading

**Objective:** Verify profile loads without recursion or errors

**Steps:**
1. Sign in with existing account
2. Observe loading behavior
3. Check console logs for errors

**Expected Results:**
- ✅ Profile loads within 2-3 seconds
- ✅ No infinite loop errors
- ✅ No RLS recursion errors
- ✅ User data displayed correctly

**Console Logs to Look For:**
```
AuthContext: Loading user profile for: [user-id]
AuthContext: User profile loaded: [user-name]
```

**Red Flags:**
- ❌ "infinite recursion detected"
- ❌ Multiple rapid "Loading user profile" messages
- ❌ Profile never loads

---

### 3. Test Household Onboarding

**Objective:** Verify create and join household flows

#### Test 3A: Create Household

**Steps:**
1. Sign in with new account (no household)
2. Select role (e.g., "Adult")
3. Choose "Create Household"
4. Enter household name: "Smith Family"
5. Enter address (optional): "123 Main St"
6. Click "Create Household"

**Expected Results:**
- ✅ Success alert with invite code
- ✅ Redirected to dashboard
- ✅ Household created in database
- ✅ User's `household_id` updated

**Database Verification:**
```sql
-- Check household was created
SELECT id, name, address, invite_code, members_count
FROM public.households
WHERE name = 'Smith Family';

-- Check user was assigned to household
SELECT id, name, household_id
FROM public.users
WHERE email = 'test@example.com';
```

#### Test 3B: Join Household

**Steps:**
1. Sign in with second account (no household)
2. Select role (e.g., "Child")
3. Choose "Join Household"
4. Enter invite code from Test 3A
5. Click "Join Household"

**Expected Results:**
- ✅ Success alert: "You have joined [household name]"
- ✅ Redirected to dashboard
- ✅ User's `household_id` updated
- ✅ Household `members_count` incremented

**Database Verification:**
```sql
-- Check user joined household
SELECT u.name, u.role, h.name as household_name
FROM public.users u
JOIN public.households h ON u.household_id = h.id
WHERE u.email = 'second-user@example.com';

-- Check members count increased
SELECT name, members_count
FROM public.households
WHERE name = 'Smith Family';
-- Should show members_count = 2
```

---

### 4. Test Tasks Module

**Objective:** Verify full CRUD operations and real-time sync

#### Test 4A: Create Task (Adult)

**Steps:**
1. Sign in as Adult user
2. Navigate to Tasks tab
3. Click "+" button
4. Enter task details:
   - Title: "Take out trash"
   - Description: "Every Thursday evening"
5. Click "Add"

**Expected Results:**
- ✅ Modal closes
- ✅ Task appears in "Pending" section
- ✅ Task saved to database
- ✅ Real-time update on other devices

#### Test 4B: Complete Task

**Steps:**
1. Tap on task card
2. Observe status change

**Expected Results:**
- ✅ Task moves to "Completed" section
- ✅ Checkmark icon appears
- ✅ Task text has strikethrough
- ✅ `completed_at` timestamp set in database

#### Test 4C: Delete Task (Adult Only)

**Steps:**
1. Long press on task card
2. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Task removed from list
- ✅ Task deleted from database

#### Test 4D: Child Permissions

**Steps:**
1. Sign in as Child user
2. Navigate to Tasks tab
3. Try to create task

**Expected Results:**
- ✅ "+" button not visible
- ✅ Can tap to complete assigned tasks
- ✅ Cannot delete tasks (no long press action)

---

### 5. Test Shopping List Module

**Objective:** Verify CRUD operations and permissions

#### Test 5A: Add Item

**Steps:**
1. Navigate to Shopping tab
2. Click "+" button
3. Enter item details:
   - Name: "Milk"
   - Quantity: "1 gallon"
   - Category: "Dairy"
4. Click "Add"

**Expected Results:**
- ✅ Item appears in "Needed" section
- ✅ Item saved to database
- ✅ Real-time update on other devices

#### Test 5B: Mark Purchased

**Steps:**
1. Tap on item card
2. Observe status change

**Expected Results:**
- ✅ Item moves to "Purchased" section
- ✅ Checkmark icon appears
- ✅ Item text has strikethrough
- ✅ `purchased_at` timestamp set

#### Test 5C: Child Can Add Items

**Steps:**
1. Sign in as Child user
2. Navigate to Shopping tab
3. Add new item

**Expected Results:**
- ✅ "+" button visible
- ✅ Can add items
- ✅ Cannot delete items (permission denied)

---

### 6. Test Events Module

**Objective:** Verify event creation and display

#### Test 6A: Create Event

**Steps:**
1. Sign in as Adult
2. Navigate to Calendar tab
3. Click "+" button
4. Enter event details:
   - Title: "Family Dinner"
   - Description: "Weekly family gathering"
5. Click "Add"

**Expected Results:**
- ✅ Event appears in "Upcoming Events"
- ✅ Event saved to database
- ✅ Date formatted correctly

#### Test 6B: Child Permissions

**Steps:**
1. Sign in as Child
2. Navigate to Calendar tab

**Expected Results:**
- ✅ "+" button not visible
- ✅ Can view events
- ✅ Cannot delete events

---

### 7. Test Expenses Module

**Objective:** Verify expense tracking and calculations

#### Test 7A: Add Expense

**Steps:**
1. Sign in as Adult
2. Navigate to Expenses tab
3. Click "+" button
4. Enter expense details:
   - Title: "Groceries"
   - Amount: "150.50"
   - Category: "Groceries"
5. Click "Add"

**Expected Results:**
- ✅ Expense appears in list
- ✅ Total amount updated
- ✅ Category total updated
- ✅ Expense saved to database

#### Test 7B: Category Totals

**Steps:**
1. Add multiple expenses in different categories
2. Observe "By Category" section

**Expected Results:**
- ✅ Each category shows correct total
- ✅ Overall total is sum of all expenses
- ✅ Amounts formatted with 2 decimal places

---

### 8. Test Real-time Synchronization

**Objective:** Verify changes sync across devices

**Setup:**
- Two devices/browsers signed in to same household
- Device A and Device B

#### Test 8A: Task Sync

**Steps:**
1. On Device A: Create new task
2. On Device B: Observe task list

**Expected Results:**
- ✅ Task appears on Device B within 1-2 seconds
- ✅ No page refresh needed

#### Test 8B: Shopping List Sync

**Steps:**
1. On Device A: Add shopping item
2. On Device B: Mark item as purchased
3. On Device A: Observe item status

**Expected Results:**
- ✅ Item appears on Device B immediately
- ✅ Status change syncs to Device A
- ✅ Both devices show same state

---

### 9. Test Error Handling

**Objective:** Verify graceful error handling

#### Test 9A: Invalid Email

**Steps:**
1. Try to sign up with invalid email: "notanemail"
2. Observe error message

**Expected Results:**
- ✅ Error alert displayed
- ✅ Form not submitted
- ✅ User can correct and retry

#### Test 9B: Weak Password

**Steps:**
1. Try to sign up with password: "123"
2. Observe error message

**Expected Results:**
- ✅ Error: "Password must be at least 6 characters"
- ✅ Form not submitted

#### Test 9C: Invalid Invite Code

**Steps:**
1. Try to join household with code: "INVALID"
2. Observe error message

**Expected Results:**
- ✅ Error: "Invalid invite code"
- ✅ User remains on onboarding screen

#### Test 9D: Network Error

**Steps:**
1. Disable network connection
2. Try to create task
3. Observe error handling

**Expected Results:**
- ✅ Error message displayed
- ✅ Loading indicator stops
- ✅ User can retry when network restored

---

### 10. Test Role-Based Permissions

**Objective:** Verify permission enforcement

| Action | Adult | Parent | Child | Roommate |
|--------|-------|--------|-------|----------|
| Create Task | ✅ | ✅ | ❌ | ✅ |
| Complete Task | ✅ | ✅ | ✅ (assigned only) | ✅ |
| Delete Task | ✅ | ✅ | ❌ | ✅ |
| Add Shopping Item | ✅ | ✅ | ✅ | ✅ |
| Delete Shopping Item | ✅ | ✅ | ❌ | ✅ |
| Create Event | ✅ | ✅ | ❌ | ✅ |
| Delete Event | ✅ | ✅ | ❌ | ✅ |
| Add Expense | ✅ | ✅ | ❌ | ✅ |
| Delete Expense | ✅ | ✅ | ❌ | ✅ |

**Test Each Permission:**
1. Sign in as each role
2. Attempt each action
3. Verify correct behavior

---

## Automated Testing Commands

### Database Queries for Verification

```sql
-- Check user profile exists
SELECT * FROM public.users WHERE email = 'test@example.com';

-- Check household membership
SELECT u.name, u.role, h.name as household
FROM public.users u
LEFT JOIN public.households h ON u.household_id = h.id
WHERE u.email = 'test@example.com';

-- Check tasks for household
SELECT * FROM public.tasks 
WHERE household_id = 'your-household-id'
ORDER BY created_at DESC;

-- Check shopping items
SELECT * FROM public.shopping_items
WHERE household_id = 'your-household-id'
ORDER BY purchased, created_at DESC;

-- Check events
SELECT * FROM public.household_events
WHERE household_id = 'your-household-id'
ORDER BY date;

-- Check expenses with totals
SELECT 
  category,
  COUNT(*) as count,
  SUM(amount) as total
FROM public.expenses
WHERE household_id = 'your-household-id'
GROUP BY category;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';
SELECT * FROM pg_policies WHERE tablename = 'tasks';
SELECT * FROM pg_policies WHERE tablename = 'shopping_items';
```

---

## Performance Testing

### Load Testing Scenarios

1. **Multiple Users**: 10+ users in same household
2. **Large Data Sets**: 100+ tasks, 50+ shopping items
3. **Real-time Stress**: Rapid changes from multiple devices
4. **Network Conditions**: Test on slow 3G connection

### Performance Metrics to Monitor

- Initial load time: < 3 seconds
- Profile load time: < 2 seconds
- Query response time: < 500ms
- Real-time update latency: < 2 seconds
- Memory usage: Stable (no leaks)

---

## Troubleshooting Common Issues

### Issue: Profile Not Loading

**Symptoms:**
- Stuck on loading screen
- "Could not load profile" error

**Solutions:**
1. Check if user exists in `public.users` table
2. Verify `household_id` is valid (or NULL)
3. Check RLS policies allow user to read their own data
4. Look for recursion errors in console

### Issue: Real-time Not Working

**Symptoms:**
- Changes don't appear on other devices
- Need to refresh to see updates

**Solutions:**
1. Check if realtime is enabled on table
2. Verify subscription channel name is unique
3. Check if subscription cleanup is working
4. Look for subscription errors in console

### Issue: Permission Denied

**Symptoms:**
- "Permission denied" errors
- Cannot create/update/delete records

**Solutions:**
1. Verify user is authenticated
2. Check user's role in database
3. Verify RLS policies allow the operation
4. Check if user belongs to household

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test users (cascade will delete related data)
DELETE FROM auth.users WHERE email LIKE 'test%@example.com';

-- Or delete specific household and all related data
DELETE FROM public.households WHERE name = 'Test Household';
```

---

## Continuous Testing Checklist

Run these tests after any code changes:

- [ ] Signup flow
- [ ] Login flow
- [ ] Profile loading
- [ ] Household creation
- [ ] Task CRUD operations
- [ ] Shopping list CRUD operations
- [ ] Event CRUD operations
- [ ] Expense CRUD operations
- [ ] Real-time synchronization
- [ ] Role-based permissions
- [ ] Error handling
- [ ] Network error recovery

---

**Last Updated:** December 6, 2024  
**Version:** 1.0
