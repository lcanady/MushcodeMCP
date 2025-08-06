/**
 * Caching system for frequently requested examples and patterns
 * Provides LRU cache with TTL support and performance monitoring
 */

import { logger } from './logger.js';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  evictions: number;
  totalRequests: number;
}

export interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number;
  cleanupInterval?: number;
}

/**
 * LRU Cache with TTL support and performance monitoring
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    maxSize: 1000,
    evictions: 0,
    totalRequests: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private options: CacheOptions = {}) {
    this.stats.maxSize = options.maxSize || 1000;
    
    // Start cleanup timer if TTL is enabled
    if (options.defaultTtl || options.cleanupInterval) {
      const interval = options.cleanupInterval || 60000; // 1 minute default
      this.cleanupTimer = setInterval(() => this.cleanup(), interval);
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Check TTL expiration
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.size--;
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    // Move to end of access order (most recently used)
    this.moveToEnd(key);

    logger.debug(`Cache hit for key: ${key}`, {
      operation: 'cache_get',
      accessCount: entry.accessCount
    });

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ...(ttl !== undefined && { ttl }),
      ...(ttl === undefined && this.options.defaultTtl !== undefined && { ttl: this.options.defaultTtl })
    };

    // If key already exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, entry);
      this.moveToEnd(key);
      logger.debug(`Cache updated for key: ${key}`, { operation: 'cache_update' });
      return;
    }

    // Check if we need to evict
    if (this.cache.size >= this.stats.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    // Add new entry
    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.stats.size++;

    logger.debug(`Cache set for key: ${key}`, {
      operation: 'cache_set',
      ttl: entry.ttl,
      cacheSize: this.stats.size
    });
  }

  /**
   * Check if key exists in cache (without updating access stats)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL expiration
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.size--;
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      this.removeFromAccessOrder(key);
      this.stats.size--;
      logger.debug(`Cache deleted key: ${key}`, { operation: 'cache_delete' });
    }
    return existed;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    this.stats.size = 0;
    this.stats.evictions += previousSize;
    
    logger.info(`Cache cleared, evicted ${previousSize} entries`, {
      operation: 'cache_clear'
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache keys sorted by access frequency
   */
  getKeysByFrequency(): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    const entries: Array<{ key: string; accessCount: number; lastAccessed: number }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      });
    }

    return entries.sort((a, b) => b.accessCount - a.accessCount);
  }

  /**
   * Get cache entries that are about to expire
   */
  getExpiringEntries(withinMs: number = 300000): string[] { // 5 minutes default
    const now = Date.now();
    const expiring: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl) {
        const expiresAt = entry.timestamp + entry.ttl;
        if (expiresAt - now <= withinMs && expiresAt > now) {
          expiring.push(key);
        }
      }
    }

    return expiring;
  }

  /**
   * Refresh TTL for a key
   */
  refreshTtl(key: string, newTtl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.timestamp = Date.now();
    if (newTtl !== undefined) {
      entry.ttl = newTtl;
    }

    logger.debug(`Cache TTL refreshed for key: ${key}`, {
      operation: 'cache_refresh_ttl',
      newTtl: entry.ttl
    });

    return true;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        this.stats.size--;
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cache cleanup removed ${expiredCount} expired entries`, {
        operation: 'cache_cleanup',
        remainingSize: this.stats.size
      });
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder.shift()!;
    this.cache.delete(lruKey);
    this.stats.size--;
    this.stats.evictions++;

    logger.debug(`Cache evicted LRU key: ${lruKey}`, {
      operation: 'cache_evict',
      reason: 'lru'
    });
  }

  /**
   * Move key to end of access order
   */
  private moveToEnd(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order array
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
  }

  /**
   * Destroy cache and cleanup timers
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

/**
 * Cache manager for different types of cached data
 */
export class CacheManager {
  private caches = new Map<string, LRUCache<any>>();
  private defaultOptions: CacheOptions = {
    maxSize: 1000,
    defaultTtl: 300000, // 5 minutes
    cleanupInterval: 60000 // 1 minute
  };

  /**
   * Get or create a cache instance
   */
  getCache<T>(name: string, options?: CacheOptions): LRUCache<T> {
    if (!this.caches.has(name)) {
      const cacheOptions = { ...this.defaultOptions, ...options };
      this.caches.set(name, new LRUCache<T>(cacheOptions));
      
      logger.info(`Created cache: ${name}`, {
        operation: 'cache_create',
        maxSize: cacheOptions.maxSize,
        defaultTtl: cacheOptions.defaultTtl
      });
    }
    
    return this.caches.get(name)!;
  }

  /**
   * Get statistics for all caches
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    
    return stats;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const [name, cache] of this.caches.entries()) {
      cache.clear();
      logger.info(`Cleared cache: ${name}`, { operation: 'cache_clear_all' });
    }
  }

  /**
   * Destroy all caches
   */
  destroy(): void {
    for (const [name, cache] of this.caches.entries()) {
      cache.destroy();
      logger.info(`Destroyed cache: ${name}`, { operation: 'cache_destroy' });
    }
    this.caches.clear();
  }

  /**
   * Get cache names
   */
  getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();