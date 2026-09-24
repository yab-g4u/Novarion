import { Request, Response, NextFunction } from 'express';

export function createRateLimiter(maxRequests = 60, windowMs = 60000) {
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'client';
    const now = Date.now();
    const clientRecord = rateLimitMap.get(String(ip));

    if (!clientRecord || now > clientRecord.resetAt) {
      rateLimitMap.set(String(ip), { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (clientRecord.count >= maxRequests) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    }

    clientRecord.count += 1;
    next();
  };
}
