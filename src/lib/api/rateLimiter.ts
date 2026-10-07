import { Request, Response, NextFunction } from 'express';

export interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60,000ms = 1 minute) */
  windowMs?: number;
  /** Max requests allowed within the window per client (default: 30) */
  max?: number;
  /** Max concurrent in-flight requests per client (default: 4) */
  maxConcurrent?: number;
  /** Custom error message when rate limit is exceeded */
  message?: string;
  /** Custom key generator (default: IP address) */
  keyGenerator?: (req: Request) => string;
  /** Optional skip condition */
  skip?: (req: Request) => boolean;
  /** Category or route tag for telemetry/headers */
  name?: string;
}

interface ClientBucket {
  windowStart: number;
  count: number;
  activeConcurrent: number;
}

/**
 * Universal Sliding-Window Rate Limiter Middleware for Express.
 * Protects backend routes and prevents Gemini API quota exhaustion.
 */
export class RateLimiter {
  private readonly store = new Map<string, ClientBucket>();
  public readonly windowMs: number;
  public readonly max: number;
  public readonly maxConcurrent: number;
  private readonly message: string;
  private readonly keyGenerator: (req: Request) => string;
  private readonly skip?: (req: Request) => boolean;
  public readonly name: string;

  constructor(options: RateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? 60 * 1000;
    this.max = options.max ?? 30;
    this.maxConcurrent = options.maxConcurrent ?? 4;
    this.name = options.name ?? 'default';
    this.message = options.message ?? 'Too many requests. Please slow down and try again shortly.';
    this.skip = options.skip;

    this.keyGenerator = options.keyGenerator ?? ((req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
        if (ip) return ip;
      }
      return req.ip || req.socket.remoteAddress || 'unknown-client';
    });
  }

  /**
   * Express middleware handler
   */
  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    if (this.skip && this.skip(req)) {
      return next();
    }

    const key = `${this.name}:${this.keyGenerator(req)}`;
    const now = Date.now();
    let bucket = this.store.get(key);

    if (!bucket || now - bucket.windowStart > this.windowMs) {
      bucket = {
        windowStart: now,
        count: 0,
        activeConcurrent: 0,
      };
      this.store.set(key, bucket);
    }

    const remaining = Math.max(0, this.max - bucket.count);
    const resetSeconds = Math.ceil((bucket.windowStart + this.windowMs - now) / 1000);

    // Standard rate limiting headers
    res.setHeader('X-RateLimit-Limit', this.max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());
    res.setHeader('X-RateLimit-Category', this.name);

    // 1. Check window request count limit
    if (bucket.count >= this.max) {
      res.setHeader('Retry-After', resetSeconds.toString());
      res.status(429).json({
        error: 'Too Many Requests',
        message: this.message,
        retryAfterSeconds: resetSeconds,
        limit: this.max,
        category: this.name,
      });
      return;
    }

    // 2. Check active concurrency limit
    if (bucket.activeConcurrent >= this.maxConcurrent) {
      res.setHeader('Retry-After', '3');
      res.status(429).json({
        error: 'Too Many Concurrent Requests',
        message: `Maximum simultaneous ${this.name} requests (${this.maxConcurrent}) reached. Please wait for previous tasks to finish.`,
        retryAfterSeconds: 3,
        activeConcurrent: bucket.activeConcurrent,
        category: this.name,
      });
      return;
    }

    bucket.count += 1;
    bucket.activeConcurrent += 1;

    // Track finish / close to decrement concurrency counter safely
    const release = () => {
      res.removeListener('finish', release);
      res.removeListener('close', release);
      if (bucket) {
        bucket.activeConcurrent = Math.max(0, bucket.activeConcurrent - 1);
      }
    };

    res.on('finish', release);
    res.on('close', release);

    next();
  };

  /**
   * Check status for a specific client key without incrementing
   */
  public getStatus(clientKey: string): { remaining: number; resetSeconds: number; activeConcurrent: number } {
    const key = `${this.name}:${clientKey}`;
    const bucket = this.store.get(key);
    const now = Date.now();

    if (!bucket || now - bucket.windowStart > this.windowMs) {
      return { remaining: this.max, resetSeconds: Math.ceil(this.windowMs / 1000), activeConcurrent: 0 };
    }

    const remaining = Math.max(0, this.max - bucket.count);
    const resetSeconds = Math.ceil((bucket.windowStart + this.windowMs - now) / 1000);
    return {
      remaining,
      resetSeconds,
      activeConcurrent: bucket.activeConcurrent,
    };
  }

  /**
   * Periodic memory cleanup
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.store.entries()) {
      if (now - bucket.windowStart > this.windowMs * 2 && bucket.activeConcurrent === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all records (useful in tests)
   */
  public reset(): void {
    this.store.clear();
  }
}

/**
 * Global In-Flight Gemini API Usage Throttle & Limiter.
 * Ensures internal multi-step Probe research cycles stay strictly within Gemini quota limits
 * and handles automatic exponential backoff on transient 429 errors.
 */
export class GeminiUsageLimiter {
  private inFlightFastCount = 0;
  private inFlightStrongCount = 0;
  private recentCalls: number[] = [];
  private readonly maxRpm: number;
  private readonly maxConcurrentTotal: number;

  constructor() {
    this.maxRpm = parseInt(process.env.GEMINI_RPM_LIMIT || '60', 10);
    this.maxConcurrentTotal = parseInt(process.env.GEMINI_MAX_CONCURRENT || '6', 10);
  }

  /**
   * Clean old call timestamps outside 1 minute
   */
  private pruneOldCalls(now: number): void {
    const oneMinAgo = now - 60000;
    while (this.recentCalls.length > 0 && this.recentCalls[0] < oneMinAgo) {
      this.recentCalls.shift();
    }
  }

  /**
   * Returns current Gemini usage metrics
   */
  public getUsageStats() {
    const now = Date.now();
    this.pruneOldCalls(now);
    return {
      currentRpm: this.recentCalls.length,
      maxRpm: this.maxRpm,
      inFlightFast: this.inFlightFastCount,
      inFlightStrong: this.inFlightStrongCount,
      inFlightTotal: this.inFlightFastCount + this.inFlightStrongCount,
      maxConcurrentTotal: this.maxConcurrentTotal,
    };
  }

  /**
   * Throttle and execute a Gemini call with retry and rate-limit guard
   */
  public async executeWithRateLimit<T>(
    task: () => Promise<T>,
    tier: 'fast' | 'strong' = 'fast',
    maxRetries = 2
  ): Promise<T> {
    const now = Date.now();
    this.pruneOldCalls(now);

    // If approaching RPM ceiling, apply micro-pacing delay
    if (this.recentCalls.length >= this.maxRpm - 2) {
      const waitTime = Math.min(2500, (60000 - (now - (this.recentCalls[0] || now))) + 200);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Track active in-flight count
    if (tier === 'fast') {
      this.inFlightFastCount++;
    } else {
      this.inFlightStrongCount++;
    }
    this.recentCalls.push(Date.now());

    let attempt = 0;
    try {
      while (attempt <= maxRetries) {
        try {
          return await task();
        } catch (err: any) {
          const errMsg = String(err?.message || err);
          const isRateLimit = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');

          if (isRateLimit && attempt < maxRetries) {
            attempt++;
            const backoffMs = Math.min(5000, Math.pow(2, attempt) * 1000 + Math.random() * 500);
            console.warn(`[GeminiUsageLimiter] Hit rate limit on ${tier} tier. Retrying in ${Math.round(backoffMs)}ms (attempt ${attempt}/${maxRetries})...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
          throw err;
        }
      }
      throw new Error(`Gemini rate limit exceeded after ${maxRetries} retries`);
    } finally {
      if (tier === 'fast') {
        this.inFlightFastCount = Math.max(0, this.inFlightFastCount - 1);
      } else {
        this.inFlightStrongCount = Math.max(0, this.inFlightStrongCount - 1);
      }
    }
  }
}

// Singleton instances configured for Probe research cycles

/**
 * Dedicated rate limiter for deep Probe research cycles (streaming & synthesis)
 * Limits: 30 research requests per minute per IP, max 3 concurrent long-running investigations
 */
export const probeResearchRateLimiter = new RateLimiter({
  name: 'probe-research',
  max: 30,
  windowMs: 60 * 1000,
  maxConcurrent: 3,
  message: 'Research rate limit reached. Please wait a moment before starting another deep investigation.',
});

/**
 * Dedicated rate limiter for individual Gemini inference endpoints (documents, pressure-test, assumptions)
 * Limits: 60 requests per minute per IP, max 5 concurrent
 */
export const geminiApiRateLimiter = new RateLimiter({
  name: 'gemini-api',
  max: 60,
  windowMs: 60 * 1000,
  maxConcurrent: 5,
  message: 'AI inference rate limit reached. Please allow previous calls to resolve before making new requests.',
});

/**
 * General API rate limiter for standard CRUD endpoints
 * Limits: 120 requests per minute per IP, max 20 concurrent
 */
export const generalApiRateLimiter = new RateLimiter({
  name: 'general-api',
  max: 120,
  windowMs: 60 * 1000,
  maxConcurrent: 20,
  message: 'Too many API requests. Please wait a moment.',
});

/**
 * Global Gemini Usage Limiter instance for internal pacing
 */
export const geminiUsageLimiter = new GeminiUsageLimiter();

// Automated periodic garbage collection
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    probeResearchRateLimiter.cleanup();
    geminiApiRateLimiter.cleanup();
    generalApiRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
