
import { supabase } from '@/lib/supabase';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: any;
  [key: string]: any;
}

interface ErrorLog {
  message: string;
  stack?: string;
  name: string;
  timestamp: string;
  context: ErrorContext;
  userAgent: string;
  platform: string;
}

/**
 * Logs an error to console and optionally to a remote service
 * @param error - The error object to log
 * @param context - Additional context about where/why the error occurred
 */
export function logError(error: Error, context?: ErrorContext): ErrorLog {
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    context: context || {},
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    platform: typeof navigator !== 'undefined' 
      ? (navigator.platform || 'unknown')
      : 'unknown',
  };

  // Always log to console
  if (__DEV__) {
    console.error('🚨 Error logged:', {
      message: errorLog.message,
      name: errorLog.name,
      context: errorLog.context,
    });
    if (errorLog.stack) {
      console.error('Stack trace:', errorLog.stack);
    }
  } else {
    console.error('Error:', errorLog.message);
  }

  // In production, send to error tracking service
  if (!__DEV__) {
    sendErrorToService(errorLog).catch(err => {
      console.error('Failed to send error to tracking service:', err);
    });
  }

  return errorLog;
}

/**
 * Logs a warning message
 * @param message - The warning message
 * @param context - Additional context
 */
export function logWarning(message: string, context?: ErrorContext) {
  const warningLog = {
    message,
    timestamp: new Date().toISOString(),
    context: context || {},
    level: 'warning',
  };

  if (__DEV__) {
    console.warn('⚠️ Warning logged:', warningLog);
  } else {
    console.warn('Warning:', message);
  }

  return warningLog;
}

/**
 * Logs an info message
 * @param message - The info message
 * @param context - Additional context
 */
export function logInfo(message: string, context?: ErrorContext) {
  const infoLog = {
    message,
    timestamp: new Date().toISOString(),
    context: context || {},
    level: 'info',
  };

  if (__DEV__) {
    console.log('ℹ️ Info logged:', infoLog);
  }

  return infoLog;
}

/**
 * Sends error log to a remote tracking service
 * In production, this could be Sentry, LogRocket, or a custom service
 */
async function sendErrorToService(errorLog: ErrorLog): Promise<void> {
  try {
    // Option 1: Store in Supabase (if you have an error_logs table)
    // Uncomment and use if you create an error_logs table
    /*
    const { error } = await supabase
      .from('error_logs')
      .insert([{
        message: errorLog.message,
        stack: errorLog.stack,
        name: errorLog.name,
        timestamp: errorLog.timestamp,
        context: errorLog.context,
        user_agent: errorLog.userAgent,
        platform: errorLog.platform,
      }]);

    if (error) {
      console.error('Failed to store error in Supabase:', error);
    }
    */

    // Option 2: Send to external service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error);
    
    // For now, just log that we would send it
    console.log('Error would be sent to tracking service in production');
  } catch (err) {
    console.error('Error in sendErrorToService:', err);
  }
}

/**
 * Creates a user-friendly error message from an error object
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  // Map common error types to user-friendly messages
  const errorMessages: Record<string, string> = {
    'Network request failed': 'Unable to connect to the server. Please check your internet connection.',
    'Failed to fetch': 'Unable to load data. Please check your internet connection.',
    'Timeout': 'The request took too long. Please try again.',
    'Unauthorized': 'You need to log in to access this feature.',
    'Forbidden': 'You don&apos;t have permission to access this resource.',
    'Not Found': 'The requested resource was not found.',
  };

  // Check if we have a specific message for this error
  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.message.includes(key)) {
      return message;
    }
  }

  // Default message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Tracks user actions for debugging purposes
 */
export function trackUserAction(action: string, data?: any) {
  if (__DEV__) {
    console.log('👤 User action:', action, data);
  }
  
  // In production, you might want to send this to analytics
  // Example: Analytics.track(action, data);
}
