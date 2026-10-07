export * from '../../api/rateLimiter';
import { probeResearchRateLimiter, RateLimiter } from '../../api/rateLimiter';

export class ResearchRateLimiter extends RateLimiter {
  constructor(options: { maxRequestsPerWindow?: number; windowSizeMs?: number; maxConcurrent?: number } = {}) {
    super({
      name: 'probe-research',
      max: options.maxRequestsPerWindow ?? 30,
      windowMs: options.windowSizeMs ?? 60 * 1000,
      maxConcurrent: options.maxConcurrent ?? 4,
    });
  }
}

export const researchRateLimiter = probeResearchRateLimiter;

