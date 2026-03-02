import { z } from 'zod';

// Define limit cap
export const MAX_COMMENTARY_LIMIT = 100;

// Validate limit as optional positive integer with max 100
export const listCommentaryQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(MAX_COMMENTARY_LIMIT).optional(),
});

// Create commentary schema
export const createCommentarySchema = z.object({
    minute: z.coerce.number().int().nonnegative(),
    sequence: z.number().int().nonnegative().optional(),
    period: z.string().optional(),
    eventType: z.string().optional(),
    actor: z.string().optional(),
    team: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
    metadata: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()).optional(),
});
