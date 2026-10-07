import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  windowStart: number;
  count: number;
  activeConcurrent: number;
}

export class ResearchRateLimiter {
  private readonly store = new Map<string, RateLimitRecord>();
  private readonly maxRequestsPerWindow: number;
  private readonly windowSizeMs: number;
  private readonly maxConcurrent: number;

  constructor(options: {
    maxRequestsPerWindow?: number;
    windowSizeMs?: number;
    maxConcurrent?: number;
  } = {}) {
    this.maxRequestsPerWindow = options.maxRequestsPerWindow ?? 30; // 30 research requests per minute
    this.windowSizeMs = options.windowSizeMs ?? 60 * 1000;          // 1 minute window
    this.maxConcurrent = options.maxConcurrent ?? 4;               // max 4 simultaneous requests
  }

  private getClientKey(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
      if (ip) return ip;
    }
    return req.ip || req.socket.remoteAddress || 'unknown-client';
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const clientKey = this.getClientKey(req);
    const now = Date.now();
    let record = this.store.get(clientKey);

    if (!record || now - record.windowStart > this.windowSizeMs) {
      record = {
        windowStart: now,
        count: 0,
        activeConcurrent: 0
      };
      this.store.set(clientKey, record);
    }

    // Set rate limit headers
    const remaining = Math.max(0, this.maxRequestsPerWindow - record.count);
    const resetTimeSeconds = Math.ceil((record.windowStart + this.windowSizeMs - now) / 1000);
    res.setHeader('X-RateLimit-Limit', this.maxRequestsPerWindow.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTimeSeconds.toString());

    // Check request volume limit
    if (record.count >= this.maxRequestsPerWindow) {
      res.setHeader('Retry-After', resetTimeSeconds.toString());
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait a moment before launching another research investigation.',
        retryAfterSeconds: resetTimeSeconds
      });
      return;
    }

    // Check concurrent execution limit
    if (record.activeConcurrent >= this.maxConcurrent) {
      res.status(429).json({
        error: 'Too Many Concurrent Requests',
        message: 'You have multiple research investigations currently in progress. Please wait for one to finish.',
        retryAfterSeconds: 5
      });
      return;
    }

    record.count += 1;
    record.activeConcurrent += 1;

    // Decrement concurrency counter upon response completion
    const onFinish = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onFinish);
      if (record) {
        record.activeConcurrent = Math.max(0, record.activeConcurrent - 1);
      }
    };

    res.on('finish', onFinish);
    res.on('close', onFinish);

    next();
  };

  /**
   * Periodic garbage collection of expired IP records
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now - record.windowStart > this.windowSizeMs * 2 && record.activeConcurrent === 0) {
        this.store.delete(key);
      }
    }
  }
}

export const researchRateLimiter = new ResearchRateLimiter();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    researchRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
