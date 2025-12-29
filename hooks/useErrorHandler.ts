
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { logError, getUserFriendlyErrorMessage } from '@/utils/errorLogger';

interface UseErrorHandlerOptions {
  showAlert?: boolean;
  context?: string;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for consistent error handling throughout the app
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showAlert = true, context = 'unknown', onError } = options;

  const handleError = useCallback(
    (error: Error | unknown, customMessage?: string) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Log the error
      logError(errorObj, {
        component: context,
        action: 'handleError',
      });

      // Call custom error handler if provided
      if (onError) {
        onError(errorObj);
      }

      // Show alert if enabled
      if (showAlert) {
        const message = customMessage || getUserFriendlyErrorMessage(errorObj);
        Alert.alert('Error', message, [{ text: 'OK' }]);
      }

      return errorObj;
    },
    [showAlert, context, onError]
  );

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      customMessage?: string
    ): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, customMessage);
        return null;
      }
    },
    [handleError]
  );

  const wrapAsync = useCallback(
    <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
      return (async (...args: Parameters<T>) => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error);
          throw error;
        }
      }) as T;
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
    wrapAsync,
  };
}

/**
 * Hook for handling network errors specifically
 */
export function useNetworkErrorHandler() {
  const { handleError } = useErrorHandler({
    context: 'NetworkRequest',
  });

  const handleNetworkError = useCallback(
    (error: Error | unknown) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a network error
      const isNetworkError = 
        errorObj.message.includes('Network') ||
        errorObj.message.includes('fetch') ||
        errorObj.message.includes('timeout');

      if (isNetworkError) {
        handleError(
          errorObj,
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      } else {
        handleError(errorObj);
      }
    },
    [handleError]
  );

  return { handleNetworkError };
}
