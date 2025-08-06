/**
 * Simple caching utilities for performance optimization
 */

export interface SimpleCacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

export class SimpleCache<T> {
  private cache = new Map<string, SimpleCacheEntry<T>>();
  private maxSize: number;
  private defaultTtl?: number;

  constructor(maxSize: number = 1000, defaultTtl?: number) {
    this.maxSize = maxSize;
    if (defaultTtl !== undefined) {
      this.defaultTtl = defaultTtl;
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: SimpleCacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ...(ttl && { ttl }),
      ...(!ttl && this.defaultTtl && { ttl: this.defaultTtl })
    };

    this.cache.set(key, entry);
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class SimpleCacheManager {
  private caches = new Map<string, SimpleCache<any>>();

  getCache<T>(name: string, maxSize?: number, defaultTtl?: number): SimpleCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new SimpleCache<T>(maxSize, defaultTtl));
    }
    return this.caches.get(name)!;
  }

  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  destroy(): void {
    this.clearAll();
    this.caches.clear();
  }
}

// Global simple cache manager
export const simpleCacheManager = new SimpleCacheManager();