
# HouseHLD Navigation Structure

## Current Navigation Flow

### 1. Root Layout (`app/_layout.tsx`)
The root layout contains the `RootNavigator` component that manages navigation based on authentication state.

**Navigation Logic:**
- **Not Authenticated** → Redirect to `/(auth)/` (Welcome Screen)
- **Authenticated + No Household** → Redirect to `/(auth)/onboarding`
- **Authenticated + Has Household** → Redirect to `/(tabs)/(home)/` (Home Dashboard)

### 2. Auth Group (`app/(auth)/`)
Contains all authentication-related screens:

- **`index.tsx`** - **WELCOME SCREEN** (This is your home/landing page for unauthenticated users)
  - Shows app branding and features
  - "Get Started" button → navigates to signup
  - "Sign In" link → navigates to login
  
- **`signup.tsx`** - User registration
- **`login.tsx`** - User sign in
- **`onboarding.tsx`** - Household setup for new users

### 3. Tabs Group (`app/(tabs)/`)
Contains all main app screens for authenticated users with households:

- **`(home)/index.tsx`** - Main dashboard (shows tasks, events, meals, shopping)
- **`tasks.tsx`** - Task management
- **`calendar.tsx`** - Calendar and events
- **`shopping.tsx`** - Shopping list
- **`meals.tsx`** - Meal planning
- **`polls.tsx`** - Family polls
- **`expenses.tsx`** - Expense tracking
- **`household.tsx`** - Household management
- **`profile.tsx`** - User profile

## Screen Locations

### Welcome Screen Location
**File:** `app/(auth)/index.tsx`
**Route:** `/(auth)/`
**When Shown:** When user is not authenticated

### Home Dashboard Location
**File:** `app/(tabs)/(home)/index.tsx`
**Route:** `/(tabs)/(home)/`
**When Shown:** When user is authenticated and has a household

## Testing Navigation

### To See Welcome Screen:
1. Sign out of the app
2. The app will automatically redirect to `/(auth)/` (Welcome Screen)

### To See Home Dashboard:
1. Sign in to the app
2. Complete household setup if needed
3. The app will automatically redirect to `/(tabs)/(home)/` (Home Dashboard)

## Common Confusion

**"Where is the Welcome screen?"**
- It's at `app/(auth)/index.tsx`, NOT `app/welcome.tsx`
- It's the default screen for unauthenticated users
- The route is `/(auth)/`, which is the index of the auth group

**"Why am I not seeing the Welcome screen?"**
- You might still be logged in
- Try signing out from the Profile screen
- The app automatically redirects authenticated users to the home dashboard

**"The modal screen replaced my home screen"**
- This was a previous bug that has been fixed
- The modal is now properly configured as a modal presentation
- The home dashboard is at `/(tabs)/(home)/index.tsx`

## Navigation Flow Diagram

```
App Start
    ↓
Check Auth State
    ↓
    ├─→ Not Authenticated → /(auth)/ [Welcome Screen]
    │                           ↓
    │                       User Actions:
    │                       - Get Started → /(auth)/signup
    │                       - Sign In → /(auth)/login
    │                           ↓
    │                       After Auth Success
    │                           ↓
    ├─→ Authenticated (No Household) → /(auth)/onboarding
    │                                       ↓
    │                                   Create/Join Household
    │                                       ↓
    └─→ Authenticated (Has Household) → /(tabs)/(home)/ [Home Dashboard]
                                            ↓
                                        Main App Tabs:
                                        - Home
                                        - Tasks
                                        - Calendar
                                        - Polls
                                        - Profile
```

## Key Files

1. **`app/_layout.tsx`** - Root navigation logic
2. **`app/(auth)/_layout.tsx`** - Auth group layout
3. **`app/(auth)/index.tsx`** - **WELCOME SCREEN**
4. **`app/(tabs)/_layout.tsx`** - Tabs layout with FloatingTabBar
5. **`app/(tabs)/(home)/index.tsx`** - Home dashboard
6. **`contexts/AuthContext.tsx`** - Authentication state management

## Summary

✅ **Welcome Screen EXISTS** at `app/(auth)/index.tsx`
✅ **Navigation Flow WORKS** correctly based on auth state
✅ **No Duplicate Screens** - each screen has a clear purpose
✅ **Modal Screen FIXED** - no longer replaces home screen

The app is working as designed. The Welcome screen is the first screen users see when not authenticated.
