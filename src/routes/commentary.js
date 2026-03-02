import { Router } from 'express';
import {
    createCommentarySchema,
    listCommentaryQuerySchema,
    MAX_COMMENTARY_LIMIT,
} from '../validation/commentary.js';
import { matchIdParamSchema } from '../validation/matches.js';
import { commentary } from '../db/schema.js';
import { db } from '../db/db.js';
import { eq, desc } from 'drizzle-orm';

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = MAX_COMMENTARY_LIMIT;

// GET route to list commentary for a match
commentaryRouter.get('/', async (req, res) => {
    const paramsParsed = matchIdParamSchema.safeParse(req.params);

    if (!paramsParsed.success) {
        return res.status(400).json({
            error: 'Invalid match ID.',
            details: paramsParsed.error.issues,
        });
    }

    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);

    if (!queryParsed.success) {
        return res.status(400).json({
            error: 'Invalid query.',
            details: queryParsed.error.issues,
        });
    }

    try {
        const { id: matchId } = paramsParsed.data;
        const { limit = 10 } = queryParsed.data;
    
        const safeLimit = Math.min(limit ?? 100, MAX_LIMIT);
        
        const data = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(safeLimit);

        res.status(200).json({ data });
    } catch (e) {
        console.error('Failed to list commentary:', e);
        res.status(500).json({ error: 'Failed to list commentary.' });
    }
})

// POST route to create commentary for a match
commentaryRouter.post('/', async (req, res) => {
    const paramsParsed = matchIdParamSchema.safeParse(req.params);

    if (!paramsParsed.success) {
        return res.status(400).json({
            error: 'Invalid match ID.',
            details: paramsParsed.error.issues,
        });
    }

    const bodyParsed = createCommentarySchema.safeParse(req.body);

    if (!bodyParsed.success) {
        return res.status(400).json({
            error: 'Invalid payload.',
            details: bodyParsed.error.issues,
        });
    }

    const { minute, sequence, period, eventType, actor, team, message, metadata, tags } = bodyParsed.data;

    try {
        const [event] = await db
            .insert(commentary)
            .values({
                matchId: paramsParsed.data.id,
                minute,
                sequence,
                period,
                eventType,
                actor,
                team,
                message,
                metadata,
                tags,
            })
            .returning();

        if (res.app.locals.broadcastCommentary) {
            try {
                res.app.locals.broadcastCommentary(event.matchId, event);
            } catch (broadcastError) {
                console.error(
                    'Failed to broadcast commentary:',
                    broadcastError,
                );
            }
        }

        res.status(201).json({ data: event });
    } catch (e) {
        console.error('Failed to create commentary:', e);
        res.status(500).json({
            error: 'Failed to create commentary.',
        });
    }
});
