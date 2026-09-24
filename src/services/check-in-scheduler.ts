/**
 * Check-in Scheduler (Phase 6)
 * 
 * Schedules outcome check-ins based on event timing or time-based defaults.
 */

import { DecisionQuery, DecisionChoice, ChoiceStatus } from '../domain/types';
import { ICalendarEventRepository, ICheckInScheduleRepository } from '../repositories/interfaces';

/**
 * Calculate when to schedule a check-in for a decision
 * 
 * Logic:
 * - If related calendar event exists: event_end_time + 1 day
 * - Otherwise: decision_time + 3 days
 */
export async function scheduleCheckIn(
  userId: string,
  decisionId: string,
  decisionQuery: DecisionQuery,
  choice: DecisionChoice,
  calendarRepo: ICalendarEventRepository,
  checkInRepo: ICheckInScheduleRepository
): Promise<Date> {
  // Don't schedule check-in for deferred decisions
  if (choice.status === 'deferred') {
    throw new Error('Cannot schedule check-in for deferred decision');
  }

  let scheduledAt: Date;

  // Try to find related calendar event
  const relatedEvent = await findRelatedCalendarEvent(
    userId,
    decisionQuery,
    calendarRepo
  );

  if (relatedEvent && relatedEvent.endTime) {
    // Event-based: 1 day after event ends
    scheduledAt = new Date(relatedEvent.endTime);
    scheduledAt.setDate(scheduledAt.getDate() + 1);
  } else {
    // Time-based default: 3 days after choice
    scheduledAt = new Date(choice.chosenAt);
    scheduledAt.setDate(scheduledAt.getDate() + 3);
  }

  // Create check-in schedule
  await checkInRepo.create({
    decisionId,
    userId,
    scheduledAt,
    status: 'pending'
  });

  return scheduledAt;
}

/**
 * Find calendar event related to a decision
 * 
 * Heuristic matching:
 * - Look for events mentioned in decision context
 * - Match by deadline date if provided
 * - Match by keywords in question
 */
async function findRelatedCalendarEvent(
  userId: string,
  query: DecisionQuery,
  calendarRepo: ICalendarEventRepository
): Promise<{ endTime: Date } | null> {
  // If decision has a deadline, look for events around that time
  if (query.impactProfile?.deadline) {
    const deadline = typeof query.impactProfile.deadline === 'string' 
      ? new Date(query.impactProfile.deadline)
      : query.impactProfile.deadline;

    const events = await calendarRepo.findUpcoming(userId, new Date());
    
    // Find event within 1 day of deadline
    const matchingEvent = events.find(event => {
      const timeDiff = Math.abs(event.endTime.getTime() - deadline.getTime());
      const oneDayMs = 24 * 60 * 60 * 1000;
      return timeDiff < oneDayMs;
    });

    if (matchingEvent) {
      return { endTime: matchingEvent.endTime };
    }
  }

  // If decision mentions specific event keywords, try keyword matching
  const question = query.question.toLowerCase();
  if (question.includes('hackathon') || question.includes('meeting') || 
      question.includes('event') || question.includes('conference')) {
    const events = await calendarRepo.findUpcoming(userId, new Date());
    
    // Simple keyword matching in event title
    const matchingEvent = events.find(event => {
      const title = event.title.toLowerCase();
      return question.split(' ').some(word => 
        word.length > 4 && title.includes(word)
      );
    });

    if (matchingEvent) {
      return { endTime: matchingEvent.endTime };
    }
  }

  return null;
}
