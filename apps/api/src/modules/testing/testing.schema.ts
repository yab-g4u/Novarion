import { z } from 'zod';

function isPrivateIpOrHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Hostname blacklists
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === '[::1]' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.lan')
  ) {
    return true;
  }

  // IPv4 private address ranges check
  // 10.0.0.0/8
  // 172.16.0.0/12 (172.16.0.0 – 172.31.255.255)
  // 192.168.0.0/16
  // 169.254.0.0/16 (link-local)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = lower.match(ipv4Regex);
  if (match) {
    const oct1 = parseInt(match[1], 10);
    const oct2 = parseInt(match[2], 10);
    const oct3 = parseInt(match[3], 10);
    const oct4 = parseInt(match[4], 10);

    if (oct1 > 255 || oct2 > 255 || oct3 > 255 || oct4 > 255) return true;

    // Loopback (127.0.0.0/8)
    if (oct1 === 127) return true;
    // Current network (0.0.0.0/8)
    if (oct1 === 0) return true;
    // 10.0.0.0/8
    if (oct1 === 10) return true;
    // 172.16.0.0/12
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return true;
    // 192.168.0.0/16
    if (oct1 === 192 && oct2 === 168) return true;
    // Link-local 169.254.0.0/16
    if (oct1 === 169 && oct2 === 254) return true;
  }

  return false;
}

export const CreateSessionInputSchema = z.object({
  productUrl: z
    .string()
    .trim()
    .min(1, { message: 'Product URL is required' })
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'productUrl must be a valid HTTP or HTTPS URL' }
    )
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return !isPrivateIpOrHost(parsed.hostname);
        } catch {
          return false;
        }
      },
      { message: 'Access to localhost, private IP addresses, or internal networks is prohibited (SSRF prevention)' }
    ),
  task: z
    .string()
    .trim()
    .min(3, { message: 'Task must be at least 3 characters long' })
    .max(1000, { message: 'Task cannot exceed 1000 characters' }),
  maxSteps: z
    .number()
    .int()
    .min(1, { message: 'maxSteps must be at least 1' })
    .max(50, { message: 'maxSteps cannot exceed safe limit of 50' })
    .optional()
    .default(25),
  timeoutMs: z
    .number()
    .int()
    .min(10000, { message: 'timeoutMs must be at least 10,000ms (10 seconds)' })
    .max(300000, { message: 'timeoutMs cannot exceed 300,000ms (5 minutes)' })
    .optional()
    .default(120000)
});

export type CreateSessionInputDto = z.infer<typeof CreateSessionInputSchema>;
