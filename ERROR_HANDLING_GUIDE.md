
# Error Handling Guide

This guide explains the comprehensive error handling system implemented in the HouseHLD app.

## Overview

The app includes multiple layers of error handling to ensure a smooth user experience:

1. **ErrorBoundary Component** - Catches React component errors
2. **Global Error Handlers** - Catches unhandled errors and promise rejections
3. **Error Logger** - Logs errors for debugging and monitoring
4. **Error Handler Hooks** - Provides consistent error handling in components

## Components

### ErrorBoundary

The `ErrorBoundary` component wraps the entire app and catches any errors that occur in the React component tree.

**Features:**
- User-friendly error screen matching the app's design
- "Try Again" button to reset the error state
- "Reload App" button to reload the entire app
- Error count tracking
- Support contact information
- Detailed error information in development mode

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

The ErrorBoundary is already set up in `app/_layout.tsx` and wraps the entire app.

### Error Screen Design

The error screen includes:
- ⚠️ Warning triangle icon (orange/yellow)
- "Oops! Something went wrong" title
- Descriptive subtitle
- Primary "Try Again" button (purple/blue)
- Secondary "Reload App" button (outlined)
- Support email: support@househld.com
- Error count for debugging

## Utilities

### Error Logger (`utils/errorLogger.ts`)

Provides functions for logging errors, warnings, and info messages.

**Functions:**

#### `logError(error: Error, context?: ErrorContext)`
Logs an error with optional context information.

```tsx
import { logError } from '@/utils/errorLogger';

try {
  // Some code that might throw
} catch (error) {
  logError(error as Error, {
    component: 'MyComponent',
    action: 'fetchData',
    userId: user.id,
  });
}
```

#### `logWarning(message: string, context?: ErrorContext)`
Logs a warning message.

```tsx
import { logWarning } from '@/utils/errorLogger';

logWarning('User attempted unauthorized action', {
  component: 'MyComponent',
  userId: user.id,
});
```

#### `logInfo(message: string, context?: ErrorContext)`
Logs an informational message.

```tsx
import { logInfo } from '@/utils/errorLogger';

logInfo('User completed onboarding', {
  component: 'Onboarding',
  userId: user.id,
});
```

#### `getUserFriendlyErrorMessage(error: Error)`
Converts technical error messages into user-friendly messages.

```tsx
import { getUserFriendlyErrorMessage } from '@/utils/errorLogger';

const friendlyMessage = getUserFriendlyErrorMessage(error);
Alert.alert('Error', friendlyMessage);
```

### Global Error Handler (`utils/globalErrorHandler.ts`)

Sets up global error handlers for unhandled errors and promise rejections.

**Functions:**

#### `setupGlobalErrorHandlers()`
Initializes global error handlers. This is automatically called in `app/_layout.tsx`.

#### `withErrorHandling<T>(fn: T, context?: string)`
Wraps an async function with error handling.

```tsx
import { withErrorHandling } from '@/utils/globalErrorHandler';

const fetchData = withErrorHandling(async () => {
  const response = await fetch('/api/data');
  return response.json();
}, 'fetchData');
```

#### `safeExecute<T>(fn: () => T, fallback: T, context?: string)`
Safely executes a function and returns a fallback value if it throws.

```tsx
import { safeExecute } from '@/utils/globalErrorHandler';

const data = safeExecute(
  () => JSON.parse(jsonString),
  {},
  'parseJSON'
);
```

## Hooks

### useErrorHandler

Custom hook for consistent error handling in components.

**Usage:**

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { handleError, handleAsyncError, wrapAsync } = useErrorHandler({
    context: 'MyComponent',
    showAlert: true,
  });

  // Handle synchronous errors
  const handleClick = () => {
    try {
      // Some code
    } catch (error) {
      handleError(error);
    }
  };

  // Handle async errors
  const fetchData = async () => {
    const data = await handleAsyncError(
      async () => {
        const response = await fetch('/api/data');
        return response.json();
      },
      'Failed to fetch data'
    );
  };

  // Wrap async function
  const wrappedFetch = wrapAsync(async () => {
    const response = await fetch('/api/data');
    return response.json();
  });
}
```

### useNetworkErrorHandler

Specialized hook for handling network errors.

**Usage:**

```tsx
import { useNetworkErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { handleNetworkError } = useNetworkErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      return response.json();
    } catch (error) {
      handleNetworkError(error);
    }
  };
}
```

## Best Practices

### 1. Always Catch Errors in Async Functions

```tsx
// ❌ Bad
const fetchData = async () => {
  const response = await fetch('/api/data');
  return response.json();
};

// ✅ Good
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    return response.json();
  } catch (error) {
    handleError(error);
    return null;
  }
};
```

### 2. Provide Context When Logging Errors

```tsx
// ❌ Bad
logError(error);

// ✅ Good
logError(error, {
  component: 'TaskList',
  action: 'deleteTask',
  taskId: task.id,
  userId: user.id,
});
```

### 3. Use User-Friendly Error Messages

```tsx
// ❌ Bad
Alert.alert('Error', error.message);

// ✅ Good
const friendlyMessage = getUserFriendlyErrorMessage(error);
Alert.alert('Error', friendlyMessage);
```

### 4. Handle Network Errors Specifically

```tsx
// ✅ Good
const { handleNetworkError } = useNetworkErrorHandler();

try {
  await fetch('/api/data');
} catch (error) {
  handleNetworkError(error); // Shows network-specific message
}
```

### 5. Use Error Boundaries for Component Errors

```tsx
// ✅ Good - Wrap risky components
<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>
```

## Testing Error Handling

A test screen is available at `app/error-test.tsx` to test different error scenarios:

1. **Error Boundary Test** - Triggers a component error
2. **Async Error Test** - Triggers an async error
3. **Warning Test** - Logs a warning
4. **Info Test** - Logs an info message

To access the test screen, navigate to `/error-test` in your app.

## Production Considerations

### Error Tracking Service

In production, you should integrate with an error tracking service like:
- **Sentry** - Popular error tracking service
- **LogRocket** - Session replay and error tracking
- **Bugsnag** - Error monitoring and reporting

To integrate, update `utils/errorLogger.ts`:

```tsx
import * as Sentry from '@sentry/react-native';

async function sendErrorToService(errorLog: ErrorLog): Promise<void> {
  Sentry.captureException(errorLog);
}
```

### Supabase Error Logging

You can also store errors in Supabase for custom tracking:

1. Create an `error_logs` table:

```sql
create table error_logs (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  stack text,
  name text,
  timestamp timestamptz not null,
  context jsonb,
  user_agent text,
  platform text,
  user_id uuid references auth.users,
  created_at timestamptz default now()
);

-- Enable RLS
alter table error_logs enable row level security;

-- Allow authenticated users to insert their own errors
create policy "Users can insert their own errors"
  on error_logs for insert
  with check (auth.uid() = user_id);
```

2. Uncomment the Supabase code in `utils/errorLogger.ts`

## Error Recovery

The app provides multiple recovery options:

1. **Try Again** - Resets the error state and re-renders the component
2. **Reload App** - Reloads the entire app using Expo Updates
3. **Contact Support** - Users can email support@househld.com

## Monitoring

In development:
- All errors are logged to the console with detailed information
- Error stack traces are displayed in the error screen

In production:
- Errors are sent to your error tracking service
- User-friendly messages are shown
- Error count is tracked for debugging

## Summary

The error handling system provides:
- ✅ Comprehensive error catching at multiple levels
- ✅ User-friendly error messages and recovery options
- ✅ Detailed logging for debugging
- ✅ Easy-to-use hooks and utilities
- ✅ Production-ready error tracking integration
- ✅ Consistent error handling patterns throughout the app
