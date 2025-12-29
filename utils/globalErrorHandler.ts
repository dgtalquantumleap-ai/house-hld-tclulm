
import { logError } from './errorLogger';
import { Alert } from 'react-native';

/**
 * Sets up global error handlers for unhandled promise rejections and errors
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof global !== 'undefined') {
    const originalHandler = global.ErrorUtils?.getGlobalHandler();

    global.ErrorUtils?.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.error('🔥 Global error handler caught:', error);
      
      logError(error, {
        component: 'GlobalErrorHandler',
        action: 'unhandledError',
        isFatal,
      });

      // Show alert in development
      if (__DEV__ && isFatal) {
        Alert.alert(
          'Unexpected Error',
          `${error.name}: ${error.message}`,
          [{ text: 'OK' }]
        );
      }

      // Call original handler if it exists
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  // Handle unhandled promise rejections
  if (typeof Promise !== 'undefined') {
    const originalRejectionHandler = Promise.prototype.catch;
    
    // Log unhandled rejections
    if (typeof global !== 'undefined' && global.HermesInternal) {
      // Hermes-specific handling
      global.addEventListener?.('unhandledrejection', (event: any) => {
        console.error('🔥 Unhandled promise rejection:', event.reason);
        
        logError(
          event.reason instanceof Error 
            ? event.reason 
            : new Error(String(event.reason)),
          {
            component: 'GlobalErrorHandler',
            action: 'unhandledRejection',
          }
        );
      });
    }
  }

  console.log('✅ Global error handlers initialized');
}

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Error in ${context || 'async function'}:`, error);
      
      logError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: context || 'unknown',
          action: 'asyncOperation',
        }
      );
      
      throw error;
    }
  }) as T;
}

/**
 * Safely executes a function and catches any errors
 */
export function safeExecute<T>(
  fn: () => T,
  fallback: T,
  context?: string
): T {
  try {
    return fn();
  } catch (error) {
    console.error(`Error in ${context || 'function'}:`, error);
    
    logError(
      error instanceof Error ? error : new Error(String(error)),
      {
        component: context || 'unknown',
        action: 'safeExecute',
      }
    );
    
    return fallback;
  }
}
