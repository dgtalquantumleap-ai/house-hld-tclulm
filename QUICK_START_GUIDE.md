
# 🚀 HouseHLD - Quick Start Guide

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔑 Environment Setup

The `.env` file has been created with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tkavowbmakdnqekweoro.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**⚠️ Important:** Never commit the `.env` file to version control!

## 🔐 OAuth Configuration (Required for Google/Apple Login)

### Google OAuth Setup:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/tkavowbmakdnqekweoro/auth/providers)
2. Enable Google provider
3. Add your Google OAuth credentials
4. Add redirect URL: `https://tkavowbmakdnqekweoro.supabase.co/auth/v1/callback`

### Apple OAuth Setup:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/tkavowbmakdnqekweoro/auth/providers)
2. Enable Apple provider
3. Add your Apple OAuth credentials
4. Add redirect URL: `https://tkavowbmakdnqekweoro.supabase.co/auth/v1/callback`

## 🏗️ Architecture Overview

### Authentication Flow
```
Welcome Screen → Sign Up/Login → Role Selection → Create/Join Household → Dashboard
```

### User Roles & Permissions
- **Parent/Adult:** Full CRUD on tasks, events, expenses, shopping items
- **Child:** Can mark assigned tasks complete, add shopping items only
- **Roommate:** Same as Adult

### Database Tables
- `users` - User profiles with role-based access
- `households` - Household groups with invite codes
- `tasks` - Chores and tasks with assignments
- `shopping_items` - Shared shopping lists
- `household_events` - Family calendar events
- `expenses` - Shared expense tracking
- `notifications` - User notifications

## 🔄 Real-Time Features

The following tables have real-time updates enabled:
- ✅ Tasks
- ✅ Shopping Items
- ✅ Household Events
- ✅ Notifications

All hooks automatically subscribe to real-time updates and clean up properly.

## 🛡️ Security Features

### RLS Policies
- All tables use Row Level Security
- Users can only access their household's data
- Role-based permissions enforced server-side

### Server-Side Validation
- Children cannot change their own role
- Children can only update task status (not other fields)
- Invite codes are securely generated

## 📱 Key Components

### Hooks
- `useAuth()` - Authentication and user management
- `useHousehold()` - Household operations
- `useTasks()` - Task CRUD with real-time updates
- `useShoppingList()` - Shopping list CRUD with real-time updates
- `useEvents()` - Event CRUD with real-time updates

### Context
- `AuthContext` - Global authentication state
- `ErrorBoundary` - Global error handling

## 🧪 Testing Checklist

### Authentication
- [ ] Email sign up
- [ ] Email login
- [ ] Google OAuth (after configuration)
- [ ] Apple OAuth (after configuration)
- [ ] Sign out

### Household Management
- [ ] Create household
- [ ] Join household with invite code
- [ ] View household members

### Tasks
- [ ] Create task (Adult/Parent only)
- [ ] Assign task to user
- [ ] Mark task complete (assigned user)
- [ ] Delete task (Adult/Parent only)
- [ ] Real-time updates across devices

### Shopping List
- [ ] Add item (all users)
- [ ] Mark item purchased
- [ ] Delete item (Adult/Parent only)
- [ ] Real-time updates across devices

### Events
- [ ] Create event (Adult/Parent only)
- [ ] View events
- [ ] Update event (Adult/Parent only)
- [ ] Delete event (Adult/Parent only)
- [ ] Real-time updates across devices

### Role-Based Access
- [ ] Child cannot delete tasks
- [ ] Child cannot create events
- [ ] Child can add shopping items
- [ ] Child can mark assigned tasks complete
- [ ] Child cannot change their own role

## 🐛 Debugging

### View Logs
```bash
# Console logs are enabled throughout the app
# Check the terminal for detailed logs
```

### Common Issues

**Issue:** "Missing Supabase environment variables"  
**Solution:** Ensure `.env` file exists with correct variables

**Issue:** OAuth not working  
**Solution:** Configure OAuth providers in Supabase Dashboard

**Issue:** Real-time updates not working  
**Solution:** Check that tables are enabled in Supabase Realtime settings

**Issue:** Permission denied errors  
**Solution:** Check user role and RLS policies

## 📚 File Structure

```
app/
  (auth)/           # Authentication screens
  (tabs)/           # Main app screens
  _layout.tsx       # Root layout with ErrorBoundary
components/
  ErrorBoundary.tsx # Global error handling
  IconSymbol.tsx    # Cross-platform icons
contexts/
  AuthContext.tsx   # Authentication context
hooks/
  useAuth.ts        # Auth hook
  useHousehold.ts   # Household hook
  useTasks.ts       # Tasks hook
  useShoppingList.ts # Shopping hook
  useEvents.ts      # Events hook
lib/
  supabase.ts       # Supabase client
utils/
  errorLogger.ts    # Error logging
styles/
  commonStyles.ts   # Shared styles
types/
  index.ts          # TypeScript types
```

## 🚀 Deployment

### Build for Production
```bash
# iOS
npm run build:ios

# Android
npm run build:android

# Web
npm run build:web
```

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] OAuth providers configured
- [ ] Environment variables set
- [ ] Error logging configured
- [ ] Database migrations applied
- [ ] RLS policies verified

## 📞 Support

For issues or questions:
1. Check `AUDIT_REPORT.md` for detailed information
2. Review console logs for error messages
3. Verify Supabase configuration
4. Check RLS policies and permissions

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅
