import { z } from 'zod';

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
  '169.254.169.254'
]);

function isPrivateNetworkHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();
  if (BLOCKED_HOSTS.has(lower)) return true;
  if (lower.endsWith('.local') || lower.endsWith('.internal') || lower.endsWith('.localhost')) {
    return true;
  }

  // Check IPv4 private ranges
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 169 && b === 254) return true; // 169.254.0.0/16
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true;
  }

  return false;
}

export function normalizeAndValidateProductUrl(rawUrl: string): {
  valid: boolean;
  normalizedUrl?: string;
  hostname?: string;
  error?: string;
} {
  let trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: 'Product URL is required' };
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only http:// and https:// protocols are allowed' };
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { valid: false, error: 'Please provide a valid public domain name (e.g., links.et)' };
  }

  if (isPrivateNetworkHostname(parsed.hostname)) {
    return {
      valid: false,
      error: 'Testing private, localhost, or internal network addresses is prohibited for security'
    };
  }

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
    hostname: parsed.hostname
  };
}

export const CreateSessionRequestSchema = z.object({
  productUrl: z
    .string()
    .trim()
    .min(3, { message: 'Product URL must be at least 3 characters' })
    .max(2000, { message: 'Product URL is too long' })
    .refine(
      (val: string) => normalizeAndValidateProductUrl(val).valid,
      {
        message: 'Invalid product URL'
      }
    ),
  task: z
    .string()
    .trim()
    .min(3, { message: 'Task description must be at least 3 characters' })
    .max(500, { message: 'Task description cannot exceed 500 characters' })
    .optional()
    .default('Explore the landing page, test main navigation, and evaluate core interactive workflow as a real user'),
  maxSteps: z.number().int().min(3).max(25).optional().default(12),
  timeoutMs: z.number().int().min(10000).max(120000).optional().default(60000),
  waitForCompletion: z.boolean().optional().default(false)
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

// Alias for controller imports
export const CreateSessionInputSchema = CreateSessionRequestSchema;
export type CreateSessionInput = CreateSessionRequest;
