/**
 * Decision Choice Routes (Phase 6)
 */

import { Router, Request, Response } from 'express';
import { 
  getDecisionRepository, 
  getDecisionChoiceRepository, 
  getCheckInScheduleRepository,
  getCalendarEventRepository
} from '../services/service-container';
import { getUserId } from '../utils/identity';
import { getErrorMessage } from '../utils/error';
import { ChosenAction, ChoiceStatus } from '../domain/types';
import { scheduleCheckIn } from '../services/check-in-scheduler';

export const choiceRouter = Router();

interface ChoiceRequestBody {
  decisionId?: string;
  chosenAction?: string;
  chosenActionDisplay?: string;
  customNotes?: string;
}

// Record user's choice for a decision
choiceRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const decisionRepo = getDecisionRepository();
    const choiceRepo = getDecisionChoiceRepository();
    const calendarRepo = getCalendarEventRepository();
    const checkInRepo = getCheckInScheduleRepository();
    
    const body = req.body as ChoiceRequestBody;

    if (!body.decisionId || typeof body.decisionId !== 'string') {
      res.status(400).json({ error: 'decisionId is required' });
      return;
    }

    if (!body.chosenAction || !['accept', 'decline', 'defer', 'custom'].includes(body.chosenAction)) {
      res.status(400).json({ error: 'chosenAction must be one of: accept, decline, defer, custom' });
      return;
    }

    if (!body.chosenActionDisplay || typeof body.chosenActionDisplay !== 'string') {
      res.status(400).json({ error: 'chosenActionDisplay is required' });
      return;
    }

    if (body.chosenAction === 'custom' && (!body.customNotes || body.customNotes.trim() === '')) {
      res.status(400).json({ error: 'customNotes is required when chosenAction is custom' });
      return;
    }

    // Verify decision exists and belongs to user
    const decision = await decisionRepo.findById(body.decisionId);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }
    if (decision.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Determine status
    const status: ChoiceStatus = body.chosenAction === 'defer' ? 'deferred' : 'final';

    // Create choice record
    const choice = await choiceRepo.create({
      decisionId: body.decisionId,
      userId,
      chosenAction: body.chosenAction as ChosenAction,
      chosenActionDisplay: body.chosenActionDisplay,
      customNotes: body.customNotes,
      aiRecommendation: decision.recommendation.option,
      chosenAt: new Date(),
      status
    });

    // Schedule check-in only for final decisions (not deferred)
    let scheduledAt: Date | null = null;
    if (status === 'final' && decision.query) {
      try {
        scheduledAt = await scheduleCheckIn(
          userId,
          body.decisionId,
          decision.query,
          choice,
          calendarRepo,
          checkInRepo
        );
      } catch (error) {
        // Log but don't fail if check-in scheduling fails
        console.error('Failed to schedule check-in:', error);
      }
    }

    res.json({ 
      choice,
      checkInScheduledAt: scheduledAt 
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get choice for a decision
choiceRouter.get('/decision/:decisionId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const decisionRepo = getDecisionRepository();
    const choiceRepo = getDecisionChoiceRepository();
    
    // Verify decision belongs to user
    const decision = await decisionRepo.findById(req.params.decisionId);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }
    if (decision.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const choice = await choiceRepo.findByDecisionId(req.params.decisionId);
    if (!choice) {
      res.status(404).json({ error: 'No choice recorded for this decision' });
      return;
    }

    res.json(choice);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// List user's choices
choiceRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const choiceRepo = getDecisionChoiceRepository();
    const limitParam = typeof req.query.limit === 'string' ? req.query.limit : '50';
    const limit = parseInt(limitParam, 10) || 50;

    const choices = await choiceRepo.findByUserId(userId, limit);
    res.json({ choices });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
