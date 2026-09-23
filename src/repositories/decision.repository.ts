/**
 * Decision Repository
 */

import { IDecisionRepository, Awaitable } from './interfaces';
import { BaseRepository } from './base.repository';
import { Decision, DecisionStatus, ContextSnapshot } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';
import { safeJsonParse } from '../utils/json';

export class SqliteDecisionRepository extends BaseRepository implements IDecisionRepository {
  findById(id: string): Awaitable<Decision | null> {
    const row = this.db.get('SELECT * FROM decisions WHERE id = ?', [id]);
    return row ? this.mapToDecision(row) : null;
  }

  findByUserId(userId: string, limit: number = 50): Awaitable<Decision[]> {
    const rows = this.db.all(`
      SELECT * FROM decisions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToDecision.bind(this));
  }

  create(decision: Omit<Decision, 'createdAt'>): Awaitable<Decision> {
    const id = decision.id || uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO decisions (id, user_id, question, context_snapshot, recommendation, user_choice, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      decision.userId,
      decision.question,
      JSON.stringify(decision.relevantContext),
      JSON.stringify(decision.recommendation),
      decision.userChoice ? JSON.stringify(decision.userChoice) : null,
      decision.status,
      now
    ]);

    return this.findById(id) as Decision;
  }

  updateChoice(id: string, userChoice: string): Awaitable<Decision | null> {
    const decision = this.findById(id) as Decision | null;
    if (!decision) return null;

    this.db.run(`
      UPDATE decisions
      SET user_choice = ?, status = ?
      WHERE id = ?
    `, [JSON.stringify(userChoice), DecisionStatus.CHOSEN, id]);

    return this.findById(id) as Decision | null;
  }

  updateStatus(id: string, status: DecisionStatus): Awaitable<Decision | null> {
    const decision = this.findById(id) as Decision | null;
    if (!decision) return null;

    this.db.run('UPDATE decisions SET status = ? WHERE id = ?', [status, id]);

    return this.findById(id) as Decision | null;
  }

  private mapToDecision(row: unknown): Decision {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;

    const contextSnapshot = typeof r.context_snapshot === 'string' ? r.context_snapshot : '{}';
    const recommendationStr = typeof r.recommendation === 'string' ? r.recommendation : '{}';
    const recommendation = safeJsonParse(recommendationStr) as Record<string, unknown>;

    const parsedContext = safeJsonParse(contextSnapshot) as ContextSnapshot;
    return {
      id: typeof r.id === 'string' ? r.id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      question: typeof r.question === 'string' ? r.question : '',
      options: [],
      relevantContext: parsedContext,
      tradeoffs: [],
      recommendation: {
        option: typeof recommendation.option === 'string' ? recommendation.option : '',
        confidence: typeof recommendation.confidence === 'number' ? recommendation.confidence : 0,
        reasoning: typeof recommendation.reasoning === 'string' ? recommendation.reasoning : ''
      },
      reasoning: typeof recommendation.reasoning === 'string' ? recommendation.reasoning : '',
      confidence: typeof recommendation.confidence === 'number' ? recommendation.confidence : 0,
      userChoice: typeof r.user_choice === 'string' && r.user_choice ? safeJsonParse(r.user_choice) as string : undefined,
      status: (typeof r.status === 'string' ? r.status : DecisionStatus.PENDING) as DecisionStatus,
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0),
      query: parsedContext?.query
    };

  }
}
