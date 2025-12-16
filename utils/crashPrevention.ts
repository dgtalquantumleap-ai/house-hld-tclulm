
import { Alert } from 'react-native';
import { logError } from './errorLogger';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: any;
}

class CrashPreventionService {
  private errorCount = 0;
  private readonly MAX_ERRORS_BEFORE_ALERT = 5;

  // Wrap async functions with error handling
  async safeAsync<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    fallbackValue?: T
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error: any) {
      this.handleError(error, context);
      return fallbackValue;
    }
  }

  // Wrap sync functions with error handling
  safeSync<T>(
    fn: () => T,
    context: ErrorContext,
    fallbackValue?: T
  ): T | undefined {
    try {
      return fn();
    } catch (error: any) {
      this.handleError(error, context);
      return fallbackValue;
    }
  }

  // Handle errors with logging and user notification
  private handleError(error: any, context: ErrorContext) {
    console.error('🚨 Error caught by crash prevention:', error);
    
    // Log error
    logError(error, context);

    // Increment error count
    this.errorCount++;

    // Show alert if too many errors
    if (this.errorCount >= this.MAX_ERRORS_BEFORE_ALERT) {
      this.showCriticalErrorAlert();
      this.errorCount = 0; // Reset counter
    }
  }

  // Show critical error alert
  private showCriticalErrorAlert() {
    Alert.alert(
      'App Stability Warning',
      'The app has encountered multiple errors. Please restart the app or contact support if the issue persists.',
      [
        {
          text: 'OK',
          style: 'default',
        },
      ]
    );
  }

  // Validate input data
  validateInput(
    value: any,
    rules: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      custom?: (value: any) => boolean;
    }
  ): { valid: boolean; error?: string } {
    if (rules.required && (!value || value.toString().trim() === '')) {
      return { valid: false, error: 'This field is required' };
    }

    if (rules.minLength && value.length < rules.minLength) {
      return { valid: false, error: `Minimum length is ${rules.minLength}` };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return { valid: false, error: `Maximum length is ${rules.maxLength}` };
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return { valid: false, error: 'Invalid format' };
    }

    if (rules.custom && !rules.custom(value)) {
      return { valid: false, error: 'Validation failed' };
    }

    return { valid: true };
  }

  // Validate email
  validateEmail(email: string): { valid: boolean; error?: string } {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validateInput(email, {
      required: true,
      pattern: emailPattern,
    });
  }

  // Validate password
  validatePassword(password: string): { valid: boolean; error?: string } {
    return this.validateInput(password, {
      required: true,
      minLength: 6,
    });
  }

  // Handle network errors
  handleNetworkError(error: any): string {
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (error.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return 'An error occurred. Please try again.';
  }

  // Handle database errors
  handleDatabaseError(error: any): string {
    if (error.code === 'PGRST116') {
      return 'Record not found.';
    }
    if (error.code === '23505') {
      return 'This record already exists.';
    }
    if (error.code === '23503') {
      return 'Cannot delete this record because it is referenced by other records.';
    }
    if (error.message?.includes('permission')) {
      return 'You do not have permission to perform this action.';
    }
    return 'Database error. Please try again.';
  }

  // Reset error count
  resetErrorCount() {
    this.errorCount = 0;
  }
}

export const crashPrevention = new CrashPreventionService();
