
import { supabase } from '@/lib/supabase';

interface ErrorContext {
  [key: string]: any;
}

export function logError(error: Error, context?: ErrorContext) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    context: context || {},
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  // Log to console in development
  if (__DEV__) {
    console.error('Error logged:', errorLog);
  }

  // In production, you could send this to a logging service
  // For now, we'll just log to console
  // Future: Send to Sentry, LogRocket, or custom error tracking service
  
  return errorLog;
}

export function logWarning(message: string, context?: ErrorContext) {
  const warningLog = {
    message,
    timestamp: new Date().toISOString(),
    context: context || {},
  };

  if (__DEV__) {
    console.warn('Warning logged:', warningLog);
  }

  return warningLog;
}
