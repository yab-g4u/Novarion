import { z } from 'zod';

export const SearchRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, { message: 'Query must be at least 2 characters long' })
    .max(500, { message: 'Query cannot exceed 500 characters' }),
  sources: z
    .array(z.enum(['reddit', 'x', 'linkedin', 'scholarxiv']))
    .optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
});

export type SearchRequestInput = z.infer<typeof SearchRequestSchema>;
