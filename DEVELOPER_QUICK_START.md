
# HouseHLD Developer Quick Start Guide

## Overview
HouseHLD is a production-ready household management app built with React Native, Expo 54, and Supabase.

## Tech Stack
- **Frontend:** React Native 0.81.4, Expo 54
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** React Context API
- **Styling:** StyleSheet (React Native)
- **TypeScript:** Full type safety

## Prerequisites
- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Supabase account

## Installation

### 1. Clone and Install
```bash
# Clone the repository
git clone [repository-url]
cd househld

# Install dependencies
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Supabase Setup
The database schema is already configured. Tables include:
- `users` - User profiles
- `households` - Household groups
- `tasks` - Tasks and chores
- `shopping_items` - Shopping list items
- `household_events` - Calendar events
- `expenses` - Shared expenses
- `notifications` - User notifications

All tables have Row Level Security (RLS) enabled.

### 4. Run the App
```bash
# Start development server
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
househld/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   │   ├── index.tsx        # Auth landing
│   │   ├── login.tsx        # Login screen
│   │   ├── signup.tsx       # Signup screen
│   │   └── onboarding.tsx   # Household setup
│   ├── (tabs)/              # Main app tabs
│   │   ├── (home)/          # Home tab
│   │   ├── tasks.tsx        # Tasks screen
│   │   ├── shopping.tsx     # Shopping list
│   │   ├── calendar.tsx     # Events calendar
│   │   ├── expenses.tsx     # Expenses tracker
│   │   └── profile.tsx      # User profile
│   ├── _layout.tsx          # Root layout
│   └── validation-dashboard.tsx  # Dev tools
├── components/              # Reusable components
│   ├── ErrorBoundary.tsx   # Error handling
│   ├── IconSymbol.tsx      # Cross-platform icons
│   └── ...
├── contexts/               # React contexts
│   └── AuthContext.tsx    # Authentication state
├── hooks/                 # Custom hooks
│   ├── useTasks.ts       # Tasks data
│   ├── useShoppingList.ts # Shopping data
│   ├── useEvents.ts      # Events data
│   └── ...
├── lib/                  # Core libraries
│   └── supabase.ts      # Supabase client
├── styles/              # Shared styles
│   └── commonStyles.ts # Colors and styles
├── types/              # TypeScript types
│   └── index.ts       # Type definitions
├── utils/             # Utility functions
│   ├── validationService.ts    # Pre-flight validation
│   ├── crashPrevention.ts      # Error handling
│   ├── performanceMonitor.ts   # Performance tracking
│   └── errorLogger.ts          # Error logging
└── app.json           # Expo configuration
```

## Key Features

### Authentication
- Email/password with verification
- Google OAuth (optional)
- Apple OAuth (optional)
- Secure session management

### Household Management
- Create or join households
- Invite code system
- Role-based permissions (Adult/Parent/Child/Roommate)
- Member management

### Tasks & Chores
- Create and assign tasks
- Recurring tasks (daily/weekly/monthly)
- Mark complete/incomplete
- Real-time sync

### Shopping List
- Add items with quantity and category
- Mark as purchased
- Real-time sync across household

### Calendar & Events
- Shared household calendar
- Recurring events
- Event reminders
- Assign events to members

### Expenses
- Track shared expenses
- Categorize spending
- View totals and summaries

### Validation Dashboard
- Backend API testing
- Frontend flow validation
- FTUE testing
- Performance monitoring
- Deployment readiness checks

## Development Workflow

### 1. Feature Development
```bash
# Create a new branch
git checkout -b feature/your-feature

# Make changes
# Test thoroughly
# Run validation dashboard

# Commit and push
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

### 2. Testing
```bash
# Run validation dashboard
# Navigate to Profile → Validation Dashboard → Run Full Validation

# Manual testing
# Test on iOS and Android
# Test offline mode
# Test error scenarios
```

### 3. Code Quality
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Common Tasks

### Adding a New Screen
1. Create file in `app/` directory
2. Use Expo Router conventions
3. Add navigation link
4. Test navigation flow

### Adding a New Database Table
1. Create migration in Supabase dashboard
2. Enable RLS
3. Create RLS policies
4. Add TypeScript types
5. Create custom hook
6. Test CRUD operations

### Adding a New Feature
1. Plan the feature
2. Update types
3. Create UI components
4. Implement business logic
5. Add error handling
6. Test thoroughly
7. Update documentation

## Debugging

### Common Issues

**Issue:** App won't start
```bash
# Clear cache
npx expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

**Issue:** Supabase connection fails
- Check `.env` file
- Verify Supabase URL and key
- Check network connection
- Review Supabase dashboard

**Issue:** Real-time not working
- Check RLS policies
- Verify user is authenticated
- Check subscription cleanup
- Review Supabase logs

### Debug Tools
- React Native Debugger
- Expo Dev Tools
- Supabase Dashboard
- Validation Dashboard (in-app)
- Console logs

## Performance Optimization

### Best Practices
- Use `React.memo` for expensive components
- Implement proper list virtualization
- Optimize images
- Minimize re-renders
- Clean up subscriptions
- Use database indexes

### Monitoring
- Use Performance Monitor utility
- Check API response times
- Monitor memory usage
- Review error logs

## Security

### Best Practices
- Never commit `.env` file
- Use RLS policies
- Validate all inputs
- Sanitize user data
- Use HTTPS only
- Keep dependencies updated

### RLS Policies
All tables have RLS enabled. Example:
```sql
-- Users can only see their household's data
create policy "Users can view household data"
  on tasks for select
  using (household_id = get_current_user_household_id());
```

## Deployment

### Development Build
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build
```bash
# Update version in app.json
# Run validation dashboard
# Test thoroughly

eas build --profile production --platform ios
eas build --profile production --platform android
```

### Submit to Stores
```bash
eas submit --platform ios
eas submit --platform android
```

## Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

### Support
- GitHub Issues: [repository-url]/issues
- Email: support@househld.com
- Discord: [discord-invite-link]

## Contributing

### Guidelines
1. Follow existing code style
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation
5. Run validation before submitting PR

### Code Style
- Use TypeScript
- Use functional components
- Use hooks for state management
- Follow React Native best practices
- Use meaningful variable names

## License
[Your License]

---

**Happy Coding! 🚀**

For questions or issues, please open a GitHub issue or contact support@househld.com.
