
import { logError } from './errorLogger';
import { Alert, Platform } from 'react-native';

/**
 * Sets up global error handlers for unhandled promise rejections and errors
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled errors
  if (typeof global !== 'undefined' && global.ErrorUtils) {
    const originalHandler = global.ErrorUtils.getGlobalHandler();

    global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
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

  // Handle unhandled promise rejections - React Native specific
  // Note: We don't use window.addEventListener in React Native
  // The global error handler above will catch most unhandled rejections
  
  // Additional promise rejection tracking for development
  if (__DEV__) {
    const originalPromiseRejection = Promise.prototype.catch;
    
    // Track unhandled rejections in development
    const trackingHandler = (promise: Promise<any>) => {
      promise.catch((error: any) => {
        console.warn('🔥 Unhandled promise rejection detected:', error);
        
        logError(
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'GlobalErrorHandler',
            action: 'unhandledRejection',
          }
        );
      });
    };

    // Note: This is for development tracking only
    // Production apps should handle promises properly
  }

  console.log('✅ Global error handlers initialized for', Platform.OS);
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
