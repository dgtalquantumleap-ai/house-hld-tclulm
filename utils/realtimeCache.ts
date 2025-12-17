
/**
 * Client-side caching utility for Supabase realtime optimization
 * Reduces database load by caching results and throttling updates
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds (default: 3000ms = 3s)
  maxSize?: number; // Maximum cache size (default: 100)
}

class RealtimeCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 3000; // 3 seconds default
  private maxSize: number = 100;
  private pendingUpdates: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: CacheConfig) {
    if (config?.ttl) this.defaultTTL = config.ttl;
    if (config?.maxSize) this.maxSize = config.maxSize;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    console.log(`RealtimeCache: Cache HIT for ${key}`);
    return entry.data as T;
  }

  /**
   * Set data in cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const cacheTTL = ttl || this.defaultTTL;

    // Enforce max cache size (LRU-style)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cacheTTL,
    });

    console.log(`RealtimeCache: Cache SET for ${key} (TTL: ${cacheTTL}ms)`);
  }

  /**
   * Invalidate (clear) cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`RealtimeCache: Cache INVALIDATED for ${key}`);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    console.log(`RealtimeCache: Invalidated ${count} entries matching pattern: ${pattern}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('RealtimeCache: All cache cleared');
  }

  /**
   * Throttle function execution to reduce database calls
   * Batches multiple rapid calls into a single execution
   */
  throttle(key: string, fn: () => void, delay: number = 1000): void {
    // Clear existing pending update
    const existing = this.pendingUpdates.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule new update
    const timeout = setTimeout(() => {
      fn();
      this.pendingUpdates.delete(key);
      console.log(`RealtimeCache: Throttled execution for ${key}`);
    }, delay);

    this.pendingUpdates.set(key, timeout);
    console.log(`RealtimeCache: Throttled call scheduled for ${key} (delay: ${delay}ms)`);
  }

  /**
   * Debounce function execution
   * Only executes after the specified delay has passed without new calls
   */
  debounce(key: string, fn: () => void, delay: number = 500): void {
    const existing = this.pendingUpdates.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(() => {
      fn();
      this.pendingUpdates.delete(key);
      console.log(`RealtimeCache: Debounced execution for ${key}`);
    }, delay);

    this.pendingUpdates.set(key, timeout);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      pendingUpdates: this.pendingUpdates.size,
      defaultTTL: this.defaultTTL,
    };
  }
}

// Export singleton instance
export const realtimeCache = new RealtimeCache({
  ttl: 3000, // 3 seconds - balances freshness with performance
  maxSize: 100,
});

// Export class for custom instances if needed
export { RealtimeCache };
