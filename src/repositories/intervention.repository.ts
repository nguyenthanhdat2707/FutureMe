/**
 * Intervention Repository (SQLite)
 */

import { IInterventionRepository, Awaitable } from './interfaces';
import { BaseRepository } from './base.repository';
import { Intervention, InterventionLevel, InterventionStatus, InterventionType } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';
import { safeJsonParse } from '../utils/json';

export class SqliteInterventionRepository extends BaseRepository implements IInterventionRepository {
  findById(id: string): Awaitable<Intervention | null> {
    const row = this.db.get('SELECT * FROM interventions WHERE id = ?', [id]);
    return row ? this.mapToIntervention(row) : null;
  }

  findByUserId(userId: string, limit: number = 50): Awaitable<Intervention[]> {
    const rows = this.db.all(`
      SELECT * FROM interventions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);

    return rows.map(this.mapToIntervention.bind(this));
  }

  findActiveByUserId(userId: string): Awaitable<Intervention[]> {
    const rows = this.db.all(`
      SELECT * FROM interventions
      WHERE user_id = ? AND status = 'ACTIVE'
      ORDER BY created_at DESC
    `, [userId]);

    return rows.map(this.mapToIntervention.bind(this));
  }

  findByIssueKey(userId: string, issueKey: string): Awaitable<Intervention | null> {
    const row = this.db.get(`
      SELECT * FROM interventions
      WHERE user_id = ? AND issue_key = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, issueKey]);

    return row ? this.mapToIntervention(row) : null;
  }

  create(intervention: Omit<Intervention, 'createdAt'>): Awaitable<Intervention> {
    const id = intervention.id || uuidv4();
    const now = new Date().toISOString();

    const suggestedActionsStr = intervention.suggestedActions
      ? JSON.stringify(intervention.suggestedActions)
      : intervention.suggestedAction
        ? JSON.stringify([intervention.suggestedAction])
        : null;

    this.db.run(`
      INSERT INTO interventions (
        id, user_id, decision_id, issue_key, type, level, status,
        reason, prompt, suggested_actions, severity, dismissed_at,
        last_material_change_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      intervention.userId,
      intervention.decisionId || null,
      intervention.issueKey,
      intervention.type,
      intervention.level,
      intervention.status || 'ACTIVE',
      intervention.reason,
      intervention.prompt || null,
      suggestedActionsStr,
      intervention.severity || null,
      intervention.dismissedAt ? intervention.dismissedAt.toISOString() : null,
      intervention.lastMaterialChangeAt ? intervention.lastMaterialChangeAt.toISOString() : null,
      now
    ]);

    return this.findById(id) as Intervention;
  }

  updateStatus(id: string, status: InterventionStatus, updates?: Partial<Intervention>): Awaitable<Intervention | null> {
    const existing = this.findById(id);
    if (!existing) return null;

    const dismissedAt = updates?.dismissedAt !== undefined
      ? (updates.dismissedAt ? updates.dismissedAt.toISOString() : null)
      : undefined;

    if (dismissedAt !== undefined) {
      this.db.run(`
        UPDATE interventions
        SET status = ?, dismissed_at = ?
        WHERE id = ?
      `, [status, dismissedAt, id]);
    } else {
      this.db.run(`
        UPDATE interventions
        SET status = ?
        WHERE id = ?
      `, [status, id]);
    }

    return this.findById(id);
  }

  dismiss(id: string, dismissedAt?: Date): Awaitable<Intervention | null> {
    const existing = this.findById(id);
    if (!existing) return null;

    const at = (dismissedAt || new Date()).toISOString();
    this.db.run(`
      UPDATE interventions
      SET status = 'DISMISSED', dismissed_at = ?
      WHERE id = ?
    `, [at, id]);

    return this.findById(id);
  }

  private mapToIntervention(row: unknown): Intervention {
    if (!row || typeof row !== 'object') throw new Error('Invalid row');
    const r = row as Record<string, unknown>;

    let suggestedActions: string[] | undefined;
    if (typeof r.suggested_actions === 'string' && r.suggested_actions.trim()) {
      const parsed = safeJsonParse(r.suggested_actions);
      if (Array.isArray(parsed)) {
        suggestedActions = parsed.filter((item): item is string => typeof item === 'string');
      }
    }

    return {
      id: typeof r.id === 'string' ? r.id : '',
      userId: typeof r.user_id === 'string' ? r.user_id : '',
      decisionId: typeof r.decision_id === 'string' ? r.decision_id : undefined,
      issueKey: typeof r.issue_key === 'string' ? r.issue_key : '',
      type: (typeof r.type === 'string' ? r.type : 'NONE') as InterventionType,
      level: (typeof r.level === 'string' ? r.level : InterventionLevel.NONE) as InterventionLevel,
      status: (typeof r.status === 'string' ? r.status : 'ACTIVE') as InterventionStatus,
      reason: typeof r.reason === 'string' ? r.reason : '',
      prompt: typeof r.prompt === 'string' ? r.prompt : undefined,
      suggestedAction: suggestedActions && suggestedActions.length > 0 ? suggestedActions[0] : undefined,
      suggestedActions,
      severity: typeof r.severity === 'string' ? (r.severity as 'low' | 'medium' | 'high') : undefined,
      dismissedAt: typeof r.dismissed_at === 'string' && r.dismissed_at ? new Date(r.dismissed_at) : undefined,
      lastMaterialChangeAt: typeof r.last_material_change_at === 'string' && r.last_material_change_at ? new Date(r.last_material_change_at) : undefined,
      createdAt: new Date(typeof r.created_at === 'string' ? r.created_at : 0)
    };
  }
}
