
/**
 * Realtime Subscription Test Utility
 * 
 * This utility helps verify that realtime subscriptions are working correctly.
 * Use this in development to test the realtime functionality.
 */

import { supabase } from '@/lib/supabase';

export interface RealtimeTestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Test if a channel can be created and subscribed to
 */
export async function testChannelSubscription(
  channelName: string,
  eventName: string
): Promise<RealtimeTestResult> {
  return new Promise((resolve) => {
    console.log(`[RealtimeTest] Testing channel: ${channelName}`);
    
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
      resolve({
        success: false,
        message: 'Subscription timed out after 10 seconds',
      });
    }, 10000);

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false },
        private: false,
      },
    });

    channel
      .on('broadcast', { event: eventName }, (payload) => {
        console.log(`[RealtimeTest] Received event: ${eventName}`, payload);
      })
      .subscribe((status, err) => {
        console.log(`[RealtimeTest] Channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          resolve({
            success: true,
            message: `Successfully subscribed to ${channelName}`,
            details: { status, channelName, eventName },
          });
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          resolve({
            success: false,
            message: `Channel error: ${err?.message || 'Unknown error'}`,
            details: { status, error: err },
          });
        } else if (status === 'TIMED_OUT') {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          resolve({
            success: false,
            message: 'Channel subscription timed out',
            details: { status },
          });
        }
      });
  });
}

/**
 * Test all household channels
 */
export async function testHouseholdChannels(
  householdId: string
): Promise<RealtimeTestResult[]> {
  console.log(`[RealtimeTest] Testing all channels for household: ${householdId}`);
  
  const results: RealtimeTestResult[] = [];

  // Test tasks channel
  const tasksResult = await testChannelSubscription(
    `household:${householdId}:tasks`,
    'task_created'
  );
  results.push(tasksResult);

  // Test shopping channel
  const shoppingResult = await testChannelSubscription(
    `household:${householdId}:shopping`,
    'shopping_item_created'
  );
  results.push(shoppingResult);

  // Test events channel
  const eventsResult = await testChannelSubscription(
    `household:${householdId}:events`,
    'event_created'
  );
  results.push(eventsResult);

  return results;
}

/**
 * Test database trigger by creating and deleting a test record
 */
export async function testDatabaseTrigger(
  householdId: string,
  table: 'tasks' | 'shopping_items' | 'household_events'
): Promise<RealtimeTestResult> {
  console.log(`[RealtimeTest] Testing database trigger for ${table}`);
  
  try {
    // Create a test record
    const testData = {
      household_id: householdId,
      title: 'TEST - Delete Me',
      description: 'This is a test record for realtime verification',
      ...(table === 'tasks' && { frequency: 'one-time', status: 'pending' }),
      ...(table === 'shopping_items' && { name: 'TEST - Delete Me', purchased: false }),
      ...(table === 'household_events' && { 
        date: new Date().toISOString().split('T')[0],
        repeat: 'none'
      }),
    };

    const { data, error } = await supabase
      .from(table)
      .insert(testData)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: `Failed to create test record: ${error.message}`,
        details: { error },
      };
    }

    console.log(`[RealtimeTest] Created test record:`, data);

    // Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Delete the test record
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.warn(`[RealtimeTest] Failed to delete test record:`, deleteError);
    }

    return {
      success: true,
      message: `Successfully tested ${table} trigger`,
      details: { table, recordId: data.id },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Exception testing trigger: ${error.message}`,
      details: { error },
    };
  }
}

/**
 * Run a comprehensive realtime test suite
 */
export async function runRealtimeTestSuite(
  householdId: string
): Promise<{
  passed: number;
  failed: number;
  results: RealtimeTestResult[];
}> {
  console.log('[RealtimeTest] Starting comprehensive test suite...');
  
  const results: RealtimeTestResult[] = [];

  // Test channel subscriptions
  const channelResults = await testHouseholdChannels(householdId);
  results.push(...channelResults);

  // Test database triggers
  const tasksTriggersResult = await testDatabaseTrigger(householdId, 'tasks');
  results.push(tasksTriggersResult);

  const shoppingTriggerResult = await testDatabaseTrigger(householdId, 'shopping_items');
  results.push(shoppingTriggerResult);

  const eventsTriggerResult = await testDatabaseTrigger(householdId, 'household_events');
  results.push(eventsTriggerResult);

  // Count results
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('[RealtimeTest] Test suite completed');
  console.log(`[RealtimeTest] Passed: ${passed}, Failed: ${failed}`);
  
  return { passed, failed, results };
}

/**
 * Monitor realtime connection health
 */
export function monitorRealtimeHealth(intervalMs: number = 30000): () => void {
  console.log('[RealtimeTest] Starting realtime health monitor...');
  
  const interval = setInterval(() => {
    const channels = supabase.getChannels();
    const activeChannels = channels.filter(c => c.state === 'joined');
    const errorChannels = channels.filter(c => c.state === 'errored');
    
    console.log('[RealtimeTest] Health Check:', {
      totalChannels: channels.length,
      activeChannels: activeChannels.length,
      errorChannels: errorChannels.length,
      timestamp: new Date().toISOString(),
    });

    if (errorChannels.length > 0) {
      console.warn('[RealtimeTest] Channels in error state:', errorChannels.map(c => c.topic));
    }
  }, intervalMs);

  // Return cleanup function
  return () => {
    console.log('[RealtimeTest] Stopping health monitor');
    clearInterval(interval);
  };
}
