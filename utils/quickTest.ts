
import { supabase } from '@/lib/supabase';

/**
 * Quick Test Suite
 * Run this to quickly verify core functionality
 */

export interface QuickTestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

export class QuickTest {
  private results: QuickTestResult[] = [];

  async runAll(): Promise<QuickTestResult[]> {
    console.log('🧪 Running Quick Tests...\n');
    
    this.results = [];
    
    await this.testSupabaseConnection();
    await this.testAuthSession();
    await this.testDatabaseAccess();
    await this.testRealTimeConnection();
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`\n✅ Quick Tests Complete: ${passed}/${total} passed\n`);
    
    return this.results;
  }

  private async testSupabaseConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: 'Supabase Connection',
        passed: !error,
        message: error ? error.message : `Connected in ${duration}ms`,
        duration,
      });
    } catch (error: any) {
      this.results.push({
        name: 'Supabase Connection',
        passed: false,
        message: error.message,
        duration: Date.now() - startTime,
      });
    }
  }

  private async testAuthSession(): Promise<void> {
    const startTime = Date.now();
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: 'Auth Session',
        passed: !error,
        message: session ? 'Session active' : 'No active session',
        duration,
      });
    } catch (error: any) {
      this.results.push({
        name: 'Auth Session',
        passed: false,
        message: error.message,
        duration: Date.now() - startTime,
      });
    }
  }

  private async testDatabaseAccess(): Promise<void> {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('households')
        .select('id')
        .limit(1);
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: 'Database Access',
        passed: !error,
        message: error ? error.message : `Query completed in ${duration}ms`,
        duration,
      });
    } catch (error: any) {
      this.results.push({
        name: 'Database Access',
        passed: false,
        message: error.message,
        duration: Date.now() - startTime,
      });
    }
  }

  private async testRealTimeConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      const channel = supabase.channel('quick-test');
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Real-time connection timeout'));
        }, 5000);

        channel
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout);
            resolve();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              resolve();
            }
          });
      });

      await channel.unsubscribe();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: 'Real-time Connection',
        passed: true,
        message: `Connected in ${duration}ms`,
        duration,
      });
    } catch (error: any) {
      this.results.push({
        name: 'Real-time Connection',
        passed: false,
        message: error.message,
        duration: Date.now() - startTime,
      });
    }
  }

  getResults(): QuickTestResult[] {
    return this.results;
  }

  getSummary(): { total: number; passed: number; failed: number } {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
    };
  }
}

export const quickTest = new QuickTest();
