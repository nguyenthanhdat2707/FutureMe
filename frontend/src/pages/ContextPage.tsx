/**
 * ContextPage — What Future Me Understands
 * Personal AI dashboard: KPIs, charts, and editable context.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';
import { DEMO_PERSONA_CHANGED_EVENT } from '../config/demo-personas';
import type {
  PersonalContext,
  Goal,
  Commitment,
  Preference,
  ObservationSource,
  CalendarEvent,
} from '../types/domain';
import { bestFocusWindow, buildEstimatedFocusPattern } from '../utils/focus-patterns';

// ─── colour palette (shared across charts) ───────────────────────────────────
const COLORS = {
  goals: '#6366F1',
  commitments: '#F97316',
  preferences: '#10B981',
  decisions: '#F59E0B',
};

type HistoryPoint = { label: string; Goals: number; Commitments: number; Preferences: number; Decisions: number };

// ─── sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-1"
      style={{ border: '1px solid rgba(249,115,22,0.14)' }}
    >
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-3xl font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function SectionAccordion({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl bg-white shadow-sm overflow-hidden"
      style={{ border: '1px solid rgba(249,115,22,0.14)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-lg">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// ─── Estimated Focus Patterns ────────────────────────────────────────────────
function EstimatedFocusPatterns({ context, events }: { context: PersonalContext; events: CalendarEvent[] }) {
  const pattern = buildEstimatedFocusPattern(context, events);
  const bestWindow = bestFocusWindow(pattern);
  const hasCalendarData = events.length > 0 || context.goals.length > 0;

  // Build multi-layer streamgraph data from focus pattern
  const chartData = pattern.map((point) => {
    const focus = point.focus;
    const meeting = Math.max(0, 100 - focus) * 0.4;
    const recovery = focus < 50 ? (50 - focus) * 0.3 : 0;
    return {
      time: point.time,
      'Focus potential': focus,
      'Meeting load': Math.round(meeting),
      'Recovery': Math.round(recovery),
    };
  });

  return (
    <div
      className="rounded-3xl bg-white p-6"
      style={{ border: '1px solid rgba(40,50,70,0.08)', boxShadow: '0 8px 28px rgba(30,35,55,0.05)' }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Estimated Focus Patterns</h2>
        <span className="text-xs text-gray-400">This week</span>
      </div>
      {hasCalendarData ? (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="meetingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C4B5FD" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#C4B5FD" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid rgba(122,92,246,0.2)', fontSize: 12, background: 'white' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) => [`${String(v)}%`, name] as any}
              />
              <Area type="monotone" dataKey="Focus potential" stroke="#7C3AED" strokeWidth={2} fill="url(#focusGrad)" />
              <Area type="monotone" dataKey="Meeting load" stroke="#C4B5FD" strokeWidth={1.5} fill="url(#meetingGrad)" />
              <Area type="monotone" dataKey="Recovery" stroke="#F97316" strokeWidth={1} fill="url(#recoveryGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          {bestWindow && (
            <p className="text-sm text-gray-600 mt-3">Best estimated focus window: <strong>{bestWindow}</strong></p>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-sm py-4 text-center">Add goals or commitments to see your estimated focus window</p>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

function ContextPage() {
  const [context, setContext] = useState<PersonalContext | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: string; id: string; value: string } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadContext = useCallback(async (isInitial = false, signal?: AbortSignal) => {
    try {
      if (isInitial) setLoading(true);
      const [data, historyResult, eventsResult] = await Promise.all([
        api.context.getCurrent(),
        api.context.getHistory(30).catch(() => null),
        api.calendar.getEvents({
          start: (() => { const d = new Date(); const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow); d.setHours(0,0,0,0); return d.toISOString(); })(),
          end: (() => { const d = new Date(); const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow+7); d.setHours(0,0,0,0); return d.toISOString(); })(),
        }).catch(() => []),
      ]);
      if (signal?.aborted) return;
      setContext(data);
      if (historyResult?.history) {
        setHistoryData(historyResult.history.map((p) => ({
          label: p.label,
          Goals: p.goals,
          Commitments: p.commitments,
          Preferences: p.preferences,
          Decisions: p.decisions,
        })));
      }
      if (eventsResult) setWeekEvents(eventsResult as CalendarEvent[]);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load context');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadContext(false, controller.signal);
    return () => controller.abort();
  }, [loadContext]);

  useEffect(() => {
    const handler = () => {
      setContext(null);
      setHistoryData([]);
      setWeekEvents([]);
      void loadContext(false);
    };
    window.addEventListener(DEMO_PERSONA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DEMO_PERSONA_CHANGED_EVENT, handler);
  }, [loadContext]);

  const handleConfirm = async (attributeId: string) => {
    if (!attributeId) return;
    try {
      setActionInProgress(attributeId);
      await api.context.confirm(attributeId);
      await loadContext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm attribute');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStartEdit = (type: string, id: string, currentValue: string) => {
    setEditingItem({ type, id, value: currentValue });
  };

  const handleCancelEdit = () => setEditingItem(null);

  const handleSaveEdit = async () => {
    if (!editingItem?.id) return;
    try {
      setActionInProgress(editingItem.id);
      const correctedValue =
        editingItem.type === 'preference'
          ? JSON.stringify({ value: editingItem.value })
          : editingItem.value;
      await api.context.correct({ attributeId: editingItem.id, correctedValue, reason: 'User correction' });
      await loadContext();
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save correction');
    } finally {
      setActionInProgress(null);
    }
  };

  const getSourceBadge = (source?: ObservationSource, confidence?: number) => {
    if (!source) return null;
    const badges: Record<string, { label: string; color: string; bg: string }> = {
      USER_CONFIRMED: { label: 'Confirmed', color: '#15803d', bg: '#f0fdf4' },
      SYSTEM_INFERRED: { label: 'AI Inferred', color: '#7C3AED', bg: '#f5f3ff' },
      SYSTEM_OBSERVED: { label: 'Observed', color: '#1d4ed8', bg: '#eff6ff' },
      CALENDAR: { label: 'From Calendar', color: '#7e22ce', bg: '#faf5ff' },
      HISTORICAL_PATTERN: { label: 'From Pattern', color: '#b45309', bg: '#fffbeb' },
      EXTERNAL_SOURCE: { label: 'External', color: '#374151', bg: '#f9fafb' },
    };
    const b = badges[source] ?? { label: source, color: '#374151', bg: '#f9fafb' };
    const conf = confidence !== undefined && confidence < 1 ? ` (${Math.round(confidence * 100)}%)` : '';
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
        style={{ color: b.color, background: b.bg }}
      >
        {b.label}{conf}
      </span>
    );
  };

  const isInferred = (s?: ObservationSource) => s === 'SYSTEM_INFERRED' || s === 'HISTORICAL_PATTERN';
  const isUserConfirmed = (s?: ObservationSource) => s === 'USER_CONFIRMED';

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // ─── loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDFAF7' }}>
        <p className="text-gray-400">Loading context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ background: '#FDFAF7' }}>
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={() => loadContext()}
          className="px-4 py-2 rounded-lg text-white text-sm"
          style={{ background: '#F97316' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDFAF7' }}>
        <p className="text-gray-400">No context available</p>
      </div>
    );
  }

  // ─── derived data ──────────────────────────────────────────────────────────
  const gc = context.goals.length;
  const cc = context.commitments.length;
  const pc = context.preferences.length;
  const dc = context.recentDecisions.length;

  // historyData is loaded from API (real temporal data from personal_context)
  // Falls back to empty array until API responds; chart shows flat line for new users

  const barData = [
    { name: 'Goals', value: gc },
    { name: 'Commitments', value: cc },
    { name: 'Preferences', value: pc },
    { name: 'Decisions', value: dc },
  ];
  const barColors = [COLORS.goals, COLORS.commitments, COLORS.preferences, COLORS.decisions];

  // AI insight: source breakdown
  const allItems = [
    ...context.goals.map((x: Goal) => x.source),
    ...context.commitments.map((x: Commitment) => x.source),
    ...context.preferences.map((x: Preference) => x.source),
  ].filter(Boolean) as ObservationSource[];
  const confirmedCount = allItems.filter((s) => s === 'USER_CONFIRMED').length;
  const inferredCount = allItems.filter(isInferred).length;
  const calendarCount = allItems.filter((s) => s === 'CALENDAR').length;

  const latestDates = [
    ...context.goals.map((x: Goal) => x.observedAt),
    ...context.commitments.map((x: Commitment) => x.observedAt),
    ...context.preferences.map((x: Preference) => x.observedAt),
  ]
    .filter(Boolean)
    .map((d) => new Date(d as string).getTime());
  const latestDate = latestDates.length > 0 ? new Date(Math.max(...latestDates)).toLocaleDateString() : null;

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ background: '#FDFAF7' }}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">What Future Me Understands</h1>
            <p className="text-gray-500 mt-1">Your goals, commitments, and preferences — as understood by Future Me</p>
          </div>
          <div className="text-sm text-gray-400 space-y-0.5 md:text-right">
            {context.lastUpdated && (
              <p>Last updated: {formatDateTime(context.lastUpdated)}</p>
            )}
          </div>
        </header>

        {/* ── KPI row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Active Goals" value={gc} color={COLORS.goals} />
          <KpiCard label="Commitments" value={cc} color={COLORS.commitments} />
          <KpiCard label="Preferences" value={pc} color={COLORS.preferences} />
          <KpiCard label="Recent Decisions" value={dc} color={COLORS.decisions} />
        </div>

        {/* ── Understanding Evolution (line chart) ───────────────── */}
        <div
          className="rounded-2xl bg-white shadow-sm p-6"
          style={{ border: '1px solid rgba(249,115,22,0.14)' }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Understanding Evolution</h2>
            <span className="text-xs text-gray-400 italic">{historyData.length > 0 ? 'From your context history' : 'No history yet'}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={historyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid rgba(249,115,22,0.2)', fontSize: 13 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
              {(['Goals', 'Commitments', 'Preferences', 'Decisions'] as const).map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[key.toLowerCase() as keyof typeof COLORS]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Context by Category + AI Insight ──────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Context by Category — compact dot list */}
          <div
            className="rounded-3xl bg-white p-6"
            style={{ border: '1px solid rgba(40,50,70,0.08)', boxShadow: '0 8px 28px rgba(30,35,55,0.05)' }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Context by Category</p>
            <div className="space-y-3">
              {barData.map((item, i) => {
                const maxVal = Math.max(...barData.map(d => d.value), 1);
                void maxVal; // used for future scaling
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-700 shrink-0">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-800 w-5 shrink-0">{item.value}</span>
                    <div className="flex-1 flex gap-1 items-center">
                      {Array.from({ length: Math.min(item.value, 12) }, (_, dot) => (
                        <span key={dot} className="inline-block size-2 rounded-full flex-shrink-0" style={{ background: barColors[i] }} />
                      ))}
                      {item.value > 12 && <span className="text-[10px] text-gray-400">+{item.value - 12}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI insight card */}
          <div
            className="rounded-3xl bg-white p-6 flex flex-col justify-between"
            style={{ border: '1px solid rgba(40,50,70,0.08)', borderLeft: '4px solid #7C3AED', boxShadow: '0 8px 28px rgba(30,35,55,0.05)' }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">What Future Me Learned</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-3 p-2 rounded-xl bg-green-50">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>{confirmedCount}</strong> confirmed by you</span>
              </li>
              <li className="flex items-center gap-3 p-2 rounded-xl bg-violet-50">
                <span className="text-violet-500">◆</span>
                <span><strong>{inferredCount}</strong> inferred patterns</span>
              </li>
              <li className="flex items-center gap-3 p-2 rounded-xl bg-blue-50">
                <span className="text-blue-400">◷</span>
                <span><strong>{calendarCount}</strong> calendar signals</span>
              </li>
              {latestDate && (
                <li className="flex items-start gap-2 text-gray-400">
                  <span className="mt-0.5">🕒</span>
                  <span>Most recent observation: {latestDate}</span>
                </li>
              )}
            </ul>
            {latestDate && (
              <div className="mt-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                <p className="text-xs font-semibold text-violet-700 mb-1">Most recent signal</p>
                <p className="text-xs text-violet-600">Last observed: {latestDate}</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">
              Total context items: <strong>{gc + cc + pc + dc}</strong>
            </p>
          </div>
        </div>

        {/* ── Focus Patterns (estimated from calendar) ─────────── */}
        <EstimatedFocusPatterns context={context} events={weekEvents} />

        {/* ── Personal Context ──────────────────────────────────── */}

        {/* Goals */}
        <SectionAccordion title={`Active Goals (${gc})`}>
          {gc === 0 ? (
            <p className="text-gray-400 text-sm py-2">No goals found. Add your first goal to get started.</p>
          ) : (
            <div className="space-y-3">
              {context.goals.map((goal: Goal) => (
                <div
                  key={goal.id}
                  className="rounded-xl p-4"
                  style={{ background: '#FDFAF7', border: '1px solid rgba(249,115,22,0.1)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {editingItem?.type === 'goal' && editingItem.id === goal.attributeId ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingItem.value}
                            onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-white text-gray-800 text-sm"
                            style={{ borderColor: 'rgba(249,115,22,0.3)' }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={actionInProgress === goal.attributeId}
                              className="px-3 py-1 text-xs text-white rounded-lg disabled:opacity-50"
                              style={{ background: '#F97316' }}
                            >
                              {actionInProgress === goal.attributeId ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-gray-800 text-sm">
                            {isInferred(goal.source) && (
                              <span className="text-gray-400 text-xs mr-1">AI believes:</span>
                            )}
                            {goal.description}
                          </p>
                          {goal.deadline && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Deadline: {new Date(goal.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <span
                      className={`ml-3 px-2 py-0.5 text-xs font-semibold rounded-md ${
                        goal.priority === 'high'
                          ? 'bg-red-50 text-red-600'
                          : goal.priority === 'medium'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {goal.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-2">
                      {getSourceBadge(goal.source, goal.confidence)}
                      {goal.observedAt && (
                        <span className="text-xs text-gray-400">
                          Observed: {new Date(goal.observedAt).toLocaleDateString()}
                        </span>
                      )}
                      {goal.validUntil && (
                        <span className="text-xs text-gray-400">
                          Valid until: {new Date(goal.validUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {goal.attributeId && !isUserConfirmed(goal.source) && goal.source !== 'CALENDAR' && editingItem?.id !== goal.attributeId && (
                      <div className="flex gap-2">
                        {isInferred(goal.source) && (
                          <button
                            onClick={() => handleConfirm(goal.attributeId!)}
                            disabled={actionInProgress === goal.attributeId}
                            className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50"
                          >
                            {actionInProgress === goal.attributeId ? '...' : '✓ Confirm'}
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit('goal', goal.attributeId!, goal.description)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionAccordion>

        {/* Commitments */}
        <SectionAccordion title={`Active Commitments (${cc})`}>
          {cc === 0 ? (
            <p className="text-gray-400 text-sm py-2">No commitments tracked yet.</p>
          ) : (
            <div className="space-y-3">
              {context.commitments.map((commitment: Commitment) => (
                <div
                  key={commitment.id}
                  className="rounded-xl p-4"
                  style={{ background: '#FDFAF7', border: '1px solid rgba(249,115,22,0.1)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingItem?.type === 'commitment' && editingItem.id === commitment.attributeId ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingItem.value}
                            onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-white text-gray-800 text-sm"
                            style={{ borderColor: 'rgba(249,115,22,0.3)' }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={actionInProgress === commitment.attributeId}
                              className="px-3 py-1 text-xs text-white rounded-lg disabled:opacity-50"
                              style={{ background: '#F97316' }}
                            >
                              {actionInProgress === commitment.attributeId ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-gray-800 text-sm">
                            {isInferred(commitment.source) && (
                              <span className="text-gray-400 text-xs mr-1">AI believes:</span>
                            )}
                            {commitment.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(commitment.startTime).toLocaleString()} –{' '}
                            {new Date(commitment.endTime).toLocaleString()}
                          </p>
                          {commitment.recurring && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded">
                              RECURRING
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSourceBadge(commitment.source, commitment.confidence)}
                      {commitment.observedAt && (
                        <span className="text-xs text-gray-400">
                          Observed: {new Date(commitment.observedAt).toLocaleDateString()}
                        </span>
                      )}
                      {commitment.validUntil && (
                        <span className="text-xs text-gray-400">
                          Valid until: {new Date(commitment.validUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {commitment.attributeId && !isUserConfirmed(commitment.source) && commitment.source !== 'CALENDAR' && editingItem?.id !== commitment.attributeId && (
                      <div className="flex gap-2">
                        {isInferred(commitment.source) && (
                          <button
                            onClick={() => handleConfirm(commitment.attributeId!)}
                            disabled={actionInProgress === commitment.attributeId}
                            className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50"
                          >
                            {actionInProgress === commitment.attributeId ? '...' : '✓ Confirm'}
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit('commitment', commitment.attributeId!, commitment.description)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionAccordion>

        {/* Preferences */}
        <SectionAccordion title={`Your Preferences (${pc})`}>
          {pc === 0 ? (
            <p className="text-gray-400 text-sm py-2">No preferences learned yet.</p>
          ) : (
            <div className="space-y-3">
              {context.preferences.map((pref: Preference) => (
                <div
                  key={pref.id}
                  className="rounded-xl p-4"
                  style={{ background: '#FDFAF7', border: '1px solid rgba(249,115,22,0.1)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingItem?.type === 'preference' && editingItem.id === pref.attributeId ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingItem.value}
                            onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-white text-gray-800 text-sm"
                            style={{ borderColor: 'rgba(249,115,22,0.3)' }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={actionInProgress === pref.attributeId}
                              className="px-3 py-1 text-xs text-white rounded-lg disabled:opacity-50"
                              style={{ background: '#F97316' }}
                            >
                              {actionInProgress === pref.attributeId ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-gray-800 text-sm">{pref.category}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {isInferred(pref.source) && (
                              <span className="text-gray-400 text-xs mr-1">AI believes: </span>
                            )}
                            {pref.description}
                          </p>
                          <p className="font-mono text-sm text-gray-700 mt-0.5">{pref.value}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSourceBadge(pref.source, pref.confidence)}
                      {pref.observedAt && (
                        <span className="text-xs text-gray-400">
                          Observed: {new Date(pref.observedAt).toLocaleDateString()}
                        </span>
                      )}
                      {pref.validUntil && (
                        <span className="text-xs text-gray-400">
                          Valid until: {new Date(pref.validUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {pref.attributeId && !isUserConfirmed(pref.source) && pref.source !== 'CALENDAR' && editingItem?.id !== pref.attributeId && (
                      <div className="flex gap-2">
                        {isInferred(pref.source) && (
                          <button
                            onClick={() => handleConfirm(pref.attributeId!)}
                            disabled={actionInProgress === pref.attributeId}
                            className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50"
                          >
                            {actionInProgress === pref.attributeId ? '...' : '✓ Confirm'}
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit('preference', pref.attributeId!, pref.value)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionAccordion>

        {/* Recent Decisions */}
        {dc > 0 && (
          <SectionAccordion title={`Recent Decisions (${dc})`}>
            <p className="text-sm text-gray-500 py-2">
              {dc} decision{dc !== 1 ? 's' : ''} in recent history
            </p>
          </SectionAccordion>
        )}

        {/* ── Calendar Overview ─────────────────────────────────── */}
        <div
          className="rounded-2xl bg-white shadow-sm p-6"
          style={{ border: '1px solid rgba(249,115,22,0.14)' }}
        >
          <h2 className="text-base font-semibold text-gray-800 mb-4">Calendar Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Status</p>
              <p className="font-mono text-base text-gray-800 capitalize">{context.calendar.status.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Last Sync</p>
              <p className="font-mono text-base text-gray-800">
                {context.calendar.lastSync ? new Date(context.calendar.lastSync).toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Upcoming Events</p>
              <p className="font-mono text-2xl text-gray-800">{context.calendar.upcomingEvents}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Busy Hours Today</p>
              <p className="font-mono text-2xl text-gray-800">
                {context.calendar.busyHoursToday === null
                  ? 'Unknown'
                  : `${context.calendar.busyHoursToday.toFixed(1)}h`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Busy Hours This Week</p>
              <p className="font-mono text-2xl text-gray-800">
                {context.calendar.busyHoursThisWeek === null
                  ? 'Unknown'
                  : `${context.calendar.busyHoursThisWeek.toFixed(1)}h`}
              </p>
            </div>
          </div>
          {weekEvents.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-400 mb-2">This week ({weekEvents.length} events)</p>
              <ul className="space-y-1">
                {weekEvents.slice(0, 8).map((ev) => {
                  const raw = (() => { try { return JSON.parse(ev.rawData ?? '{}') as Record<string, unknown>; } catch { return {}; } })();
                  const cat = typeof raw.category === 'string' ? raw.category : 'other';
                  const catColor: Record<string, string> = { deep_work: '#6366F1', meeting: '#F97316', deadline: '#EF4444', recovery: '#10B981', other: '#9CA3AF' };
                  return (
                    <li key={ev.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColor[cat] ?? '#9CA3AF' }} />
                      <span className="truncate">{ev.title}</span>
                      <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                        {new Date(ev.startTime).toLocaleString(undefined, { weekday:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </li>
                  );
                })}
                {weekEvents.length > 8 && <li className="text-xs text-gray-400">+{weekEvents.length - 8} more</li>}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ContextPage;
