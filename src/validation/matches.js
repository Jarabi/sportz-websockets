import { z } from 'zod';

// Match status constants
export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
};

// Validate limit as optional positive integer with max 100
export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

// Validate match ID parameter as positive integer
export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const isoDateString = z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid ISO date string.",
});

// Create match schema with datetime validation and refinements
export const createMatchSchema = z.object({
        sport: z.string().min(1, 'Sport is required'),
        homeTeam: z.string().min(1, 'Home team is required'),
        awayTeam: z.string().min(1, 'Away team is required'),
        startTime: isoDateString,
        endTime: isoDateString,
        homeScore: z.coerce.number().int().nonnegative().optional(),
        awayScore: z.coerce.number().int().nonnegative().optional(),
    })
    .superRefine((data, ctx) => {
        const startTime = new Date(data.startTime);
        const endTime = new Date(data.endTime);

        if (endTime <= startTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['endTime'],
                message: 'endTime must be chronologically after startTime',
            });
        }
    });

// Update score schema for match endpoints
export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().nonnegative(),
    awayScore: z.coerce.number().int().nonnegative(),
});
