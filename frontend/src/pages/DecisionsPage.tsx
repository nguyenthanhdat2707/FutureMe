import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { decisionsApi, contextApi, calendarApi } from '../api/client';
import type {
  DecisionApiRequest,
  DecisionApiResponse,
  ContextUpdateObservation,
  ObservationSource,
  CalendarEvent,
} from '../types/domain';
import { useInterventions } from '../hooks/useInterventions';
import { InterventionCard } from '../components/InterventionCard';

// ─────────────────────────────────────────────
// Preserved business-logic helpers
// ─────────────────────────────────────────────

interface ImpactProfile {
  target: string;
  deadline: string;
  timeCostHours: string;
  availableHoursBeforeDeadline: string;
  workloadHoursBeforeDeadline: string;
  energyCost: string;
  availableEnergy: string;
  goalRelevance: 'low' | 'medium' | 'high';
  source: 'user-confirmed' | 'provided' | 'estimated';
}

interface ObservationForm {
  category: 'workload-increase' | 'energy-decrease' | 'deadline-change' | 'disruption';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

const INITIAL_PROFILE: ImpactProfile = {
  target: '',
  deadline: '',
  timeCostHours: '',
  availableHoursBeforeDeadline: '',
  workloadHoursBeforeDeadline: '',
  energyCost: '',
  availableEnergy: '',
  goalRelevance: 'medium',
  source: 'user-confirmed',
};

const INITIAL_OBSERVATION: ObservationForm = {
  category: 'workload-increase',
  description: '',
  severity: 'medium',
};

function optionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readSessionValue<T>(key: string, fallback: T): T {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    sessionStorage.removeItem(key);
    return fallback;
  }
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const CLARIFICATION_ALLOWLIST = [
  'target',
  'deadline',
  'timeCostHours',
  'availableHoursBeforeDeadline',
  'workloadHoursBeforeDeadline',
  'energyCost',
  'availableEnergy',
] as const;

type ClarificationField = (typeof CLARIFICATION_ALLOWLIST)[number];

function isClarificationField(field: string): field is ClarificationField {
  return (CLARIFICATION_ALLOWLIST as readonly string[]).includes(field);
}

const FIELD_DEFINITIONS: Record<
  string,
  { label: string; type: string; min?: number; max?: number; step?: number }
> = {
  timeCostHours: { label: 'Time cost (hours)', type: 'number', min: 0, step: 0.5 },
  availableHoursBeforeDeadline: {
    label: 'Available time before deadline (hours)',
    type: 'number',
    min: 0,
    step: 0.5,
  },
  workloadHoursBeforeDeadline: {
    label: 'Existing workload before deadline (hours)',
    type: 'number',
    min: 0,
    step: 0.5,
  },
  deadline: { label: 'Deadline', type: 'datetime-local' },
  energyCost: { label: 'Energy cost (0–10)', type: 'number', min: 0, max: 10, step: 1 },
  availableEnergy: { label: 'Available energy (0–10)', type: 'number', min: 0, max: 10, step: 1 },
  target: { label: 'Decision target', type: 'text' },
};

// ─────────────────────────────────────────────
// Conversation types
// ─────────────────────────────────────────────

type ConversationItem =
  | { type: 'user_message'; text: string; timestamp: Date }
  | {
      type: 'future_me_message';
      text: string;
      timestamp: Date;
      policyOutcome?: string;
      result?: DecisionApiResponse;
    }
  | { type: 'clarification_request'; fields: string[]; conflicts: string[]; reason: string }
  | { type: 'observation_submitted'; description: string; timestamp: Date }
  | { type: 'stale_context_notice' }
  | {
      type: 'reassessment_comparison';
      beforeResult: DecisionApiResponse;
      afterResult: DecisionApiResponse;
    }
  | { type: 'error'; text: string };

// ─────────────────────────────────────────────
// History sidebar seed data
// ─────────────────────────────────────────────

const HISTORY_ITEMS = [
  { id: '1', text: 'Should I join the hackathon?', group: 'Today', time: '2h ago' },
  { id: '2', text: 'Can I take this freelance project?', group: 'Today', time: '4h ago' },
  { id: '3', text: 'Should I skip the meetup?', group: 'Yesterday', time: 'Yesterday' },
  { id: '4', text: 'Review competition submission', group: 'Yesterday', time: 'Yesterday' },
  { id: '5', text: 'Review internship application timeline', group: 'Earlier', time: '2 days ago' },
  { id: '6', text: 'Decide whether to join AWS event', group: 'Earlier', time: '3 days ago' },
];

const HISTORY_GROUPS = ['Today', 'Yesterday', 'Earlier'] as const;

// ─────────────────────────────────────────────
// Suggestion chips
// ─────────────────────────────────────────────

const SUGGESTION_CHIPS = ['Explore options', 'Understand trade-offs', 'Check buffer time'];

// ─────────────────────────────────────────────
// Visual helpers
// ─────────────────────────────────────────────

function feasibilityBadgeStyle(feasibility: string): string {
  switch (feasibility) {
    case 'feasible':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'at-risk':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'not-feasible':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-neutral-100 text-neutral-600 border border-neutral-200';
  }
}

function policyBadgeStyle(outcome: string): string {
  switch (outcome) {
    case 'RECOMMEND':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'ASK':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'ABSTAIN':
      return 'bg-neutral-100 text-neutral-500 border border-neutral-200';
    default:
      return 'bg-neutral-100 text-neutral-500 border border-neutral-200';
  }
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatCalendarHeader(): { weekday: string; date: string } {
  const now = new Date();
  return {
    weekday: now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
    date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

function isTodayEvent(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isTomorrowEvent(iso: string): boolean {
  const d = new Date(iso);
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return (
    d.getFullYear() === tom.getFullYear() &&
    d.getMonth() === tom.getMonth() &&
    d.getDate() === tom.getDate()
  );
}

function eventCategoryBadge(event: CalendarEvent): string {
  const title = event.title.toLowerCase();
  if (title.includes('deep work') || title.includes('focus')) return 'Focus';
  if (title.includes('standup') || title.includes('meeting') || title.includes('sync'))
    return 'Meeting';
  if (title.includes('gym') || title.includes('exercise') || title.includes('yoga'))
    return 'Health';
  if (title.includes('lunch') || title.includes('dinner') || title.includes('coffee'))
    return 'Social';
  if (title.includes('review') || title.includes('deadline')) return 'Review';
  return '';
}

// ─────────────────────────────────────────────
// HistorySidebar
// ─────────────────────────────────────────────

function HistorySidebar({
  onNewConversation,
  activeConversationTitle,
  onHistoryClick,
}: {
  onNewConversation: () => void;
  activeConversationTitle: string;
  onHistoryClick: (text: string) => void;
}) {
  return (
    <aside
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 4px 16px rgba(120,80,40,0.06)',
        border: '1px solid rgba(249,115,22,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid rgba(249,115,22,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#1C1917',
              letterSpacing: '-0.01em',
            }}
          >
            History
          </span>
        </div>
        <button
          type="button"
          onClick={onNewConversation}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid rgba(249,115,22,0.25)',
            background: 'rgba(249,115,22,0.06)',
            color: '#C2410C',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(249,115,22,0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(249,115,22,0.06)';
          }}
        >
          + New conversation
        </button>
      </div>

      {/* Active conversation */}
      {activeConversationTitle && (
        <div
          style={{
            margin: '8px 10px 0',
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(249,115,22,0.09)',
            border: '1px solid rgba(249,115,22,0.18)',
          }}
        >
          <p
            style={{ fontSize: 11, fontWeight: 600, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}
          >
            Active
          </p>
          <p
            style={{ fontSize: 13, color: '#1C1917', fontWeight: 500, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {activeConversationTitle}
          </p>
        </div>
      )}

      {/* History list */}
      <nav
        style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 12px' }}
        aria-label="Conversation history"
      >
        {HISTORY_GROUPS.map((group) => {
          const items = HISTORY_ITEMS.filter((i) => i.group === group);
          return (
            <div key={group} style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: '#A8A29E',
                  padding: '4px 4px 6px',
                }}
              >
                {group}
              </p>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onHistoryClick(item.text)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 10px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    marginBottom: 2,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(249,115,22,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: '#44403C',
                      fontWeight: 400,
                      lineHeight: 1.35,
                      marginBottom: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.text}
                  </p>
                  <p style={{ fontSize: 11, color: '#A8A29E' }}>{item.time}</p>
                </button>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ─────────────────────────────────────────────
// CalendarPanel
// ─────────────────────────────────────────────

function CalendarPanel({ events, loading }: { events: CalendarEvent[]; loading: boolean }) {
  const { weekday, date } = formatCalendarHeader();

  const todayEvents = events
    .filter((e) => isTodayEvent(e.startTime))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const tomorrowEvents = events
    .filter((e) => isTomorrowEvent(e.startTime))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const categoryColors: Record<string, string> = {
    Focus: 'rgba(249,115,22,0.12)',
    Meeting: 'rgba(59,130,246,0.10)',
    Health: 'rgba(34,197,94,0.10)',
    Social: 'rgba(168,85,247,0.10)',
    Review: 'rgba(245,158,11,0.12)',
    '': 'rgba(120,80,40,0.06)',
  };

  const categoryTextColors: Record<string, string> = {
    Focus: '#C2410C',
    Meeting: '#1D4ED8',
    Health: '#15803D',
    Social: '#7C3AED',
    Review: '#92400E',
    '': '#78716C',
  };

  return (
    <aside
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 4px 16px rgba(120,80,40,0.06)',
        border: '1px solid rgba(249,115,22,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 16px 14px',
          borderBottom: '1px solid rgba(249,115,22,0.08)',
          background: 'rgba(249,115,22,0.03)',
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#EA580C',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          {weekday}
        </p>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', letterSpacing: '-0.02em' }}>
          {date}
        </p>
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 56,
                  borderRadius: 12,
                  background: 'rgba(249,115,22,0.06)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        )}

        {!loading && todayEvents.length === 0 && tomorrowEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 12px', color: '#A8A29E' }}>
            <p style={{ fontSize: 13 }}>No events scheduled</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Today section */}
            {todayEvents.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#A8A29E',
                    marginBottom: 8,
                    padding: '0 2px',
                  }}
                >
                  Today
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {todayEvents.map((event) => {
                    const cat = eventCategoryBadge(event);
                    return (
                      <div
                        key={event.id}
                        style={{
                          borderRadius: 12,
                          padding: '10px 12px',
                          background: categoryColors[cat] ?? 'rgba(120,80,40,0.06)',
                          borderLeft: `3px solid ${categoryTextColors[cat] ?? '#A8A29E'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#78716C',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {formatEventTime(event.startTime)}
                          </span>
                          {cat && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: categoryTextColors[cat],
                                background: 'rgba(255,255,255,0.6)',
                                padding: '2px 7px',
                                borderRadius: 999,
                              }}
                            >
                              {cat}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#1C1917',
                            lineHeight: 1.3,
                          }}
                        >
                          {event.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tomorrow section */}
            {tomorrowEvents.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#A8A29E',
                    marginBottom: 8,
                    padding: '0 2px',
                  }}
                >
                  Tomorrow
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {tomorrowEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        borderRadius: 10,
                        padding: '8px 10px',
                        background: 'rgba(120,80,40,0.04)',
                        border: '1px solid rgba(120,80,40,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#A8A29E',
                          minWidth: 36,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatEventTime(event.startTime)}
                      </span>
                      <p style={{ fontSize: 12, color: '#57534E', lineHeight: 1.3, flex: 1 }}>
                        {event.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary card */}
            {(todayEvents.length > 0 || tomorrowEvents.length > 0) && (
              <div
                style={{
                  borderRadius: 12,
                  padding: '12px 14px',
                  background: 'rgba(249,115,22,0.06)',
                  border: '1px solid rgba(249,115,22,0.12)',
                  marginTop: 4,
                }}
              >
                <p style={{ fontSize: 12, color: '#78716C', lineHeight: 1.45 }}>
                  {todayEvents.length === 0
                    ? "You're free for the rest of today."
                    : `That's everything for today.`}{' '}
                  {tomorrowEvents.length > 0
                    ? `You have ${tomorrowEvents.length} event${tomorrowEvents.length > 1 ? 's' : ''} tomorrow starting at ${formatEventTime(tomorrowEvents[0].startTime)}.`
                    : 'Nothing scheduled for tomorrow yet.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// Conversation message components
// ─────────────────────────────────────────────

function UserMessageBubble({ text, timestamp }: { text: string; timestamp: Date }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
      <div style={{ maxWidth: '78%' }}>
        <div
          style={{
            background: 'rgba(251,146,60,0.11)',
            border: '1px solid rgba(249,115,22,0.15)',
            borderRadius: '18px 18px 18px 4px',
            padding: '12px 16px',
          }}
        >
          <p style={{ fontSize: 15, color: '#1C1917', lineHeight: 1.55, margin: 0 }}>{text}</p>
        </div>
        <p style={{ fontSize: 11, color: '#A8A29E', marginTop: 4, paddingLeft: 4 }}>
          {timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function FutureMeCard({ item, isLatest }: { item: ConversationItem & { type: 'future_me_message' }; isLatest?: boolean }) {
  const result = item.result;
  const assessment = result?.assessment;
  const recommendation = result?.decision?.recommendation;
  const tradeoffs = result?.decision?.tradeoffs;
  const confidencePercent = recommendation
    ? Math.round(Math.min(1, Math.max(0, recommendation.confidence)) * 100)
    : 0;

  function formatHours(value: number | null): string {
    return value === null ? 'N/A' : value + 'h';
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
      <div style={{ maxWidth: '85%', width: '100%' }}>
        {/* FM header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ fontSize: 11, color: '#A8A29E' }}>
            {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(249,115,22,0.12)',
              border: '1.5px solid rgba(249,115,22,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: '#EA580C' }}>FM</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#78716C' }}>Future Me</span>
          {item.policyOutcome && (
            <span
              style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}
              className={policyBadgeStyle(item.policyOutcome)}
            >
              {item.policyOutcome}
            </span>
          )}
        </div>

        {/* Main message card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(249,115,22,0.13)',
            borderRadius: '4px 18px 18px 18px',
            padding: '16px 18px',
            boxShadow: '0 2px 12px rgba(120,80,40,0.05)',
          }}
        >
          {/* Response text (not shown for ABSTAIN — rendered in the abstain notice instead) */}
          {item.policyOutcome !== 'ABSTAIN' && (
            <p style={{ fontSize: 15, color: '#1C1917', lineHeight: 1.6, marginBottom: result ? 14 : 0 }}>
              {item.text}
            </p>
          )}

          {/* Relevant context card */}
          {assessment && (
            <div
              style={{
                borderRadius: 12,
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.18)',
                padding: '12px 14px',
                marginBottom: 14,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: '#92400E',
                  marginBottom: 10,
                }}
              >
                Relevant Context
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 16px',
                }}
              >
                <ContextKV label="Feasibility" value={titleCase(assessment.feasibility)} badge={feasibilityBadgeStyle(assessment.feasibility)} />
                <ContextKV label="Deadline pressure" value={titleCase(assessment.deadlinePressure)} />
                <ContextKV label="Energy fit" value={titleCase(assessment.energyFit)} />
                <ContextKV
                  label="Capacity remaining"
                  value={formatHours(assessment.projectedRemainingCapacityHours)}
                />
              </div>
            </div>
          )}

          {/* Recommendation card */}
          {recommendation && item.policyOutcome === 'RECOMMEND' && (
            <div
              style={{
                borderRadius: 12,
                background: '#FFFFFF',
                border: '1px solid rgba(249,115,22,0.15)',
                borderLeft: '3px solid #F97316',
                padding: '12px 14px',
                marginBottom: tradeoffs && tradeoffs.length > 0 ? 14 : 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#92400E',
                  }}
                >
                  Recommendation
                </p>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#EA580C',
                    background: 'rgba(249,115,22,0.1)',
                    padding: '3px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(249,115,22,0.2)',
                  }}
                >
                  {titleCase(recommendation.option)}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#44403C', lineHeight: 1.5, marginBottom: 10 }}>
                {recommendation.reasoning}
              </p>
              {/* Confidence bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#A8A29E', flex: 1 }}>
                  Input Completeness &amp; Trustworthiness - not chance of success
                </span>
                <div
                  style={{
                    width: 72,
                    height: 4,
                    borderRadius: 999,
                    background: 'rgba(249,115,22,0.12)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${confidencePercent}%`,
                      background: '#F97316',
                      borderRadius: 999,
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#78716C', minWidth: 28 }}>
                  {confidencePercent}%
                </span>
              </div>
            </div>
          )}

          {/* Abstain notice */}
          {item.policyOutcome === 'ABSTAIN' && (
            <div
              style={{
                borderRadius: 10,
                background: 'rgba(120,80,40,0.04)',
                border: '1px solid rgba(120,80,40,0.10)',
                padding: '10px 13px',
              }}
            >
              <p style={{ fontSize: 13, color: '#57534E', lineHeight: 1.5 }}>
                {item.text}
              </p>
            </div>
          )}

          {/* Trade-offs */}
          {tradeoffs && tradeoffs.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: '#92400E',
                  marginBottom: 8,
                  margin: '0 0 8px',
                }}
              >
                Trade-offs
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 8,
                }}
              >
                {tradeoffs.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 10,
                      border: '1px solid rgba(249,115,22,0.12)',
                      padding: '10px 12px',
                      background: 'rgba(249,115,22,0.04)',
                    }}
                  >
                    <p
                      style={{ fontSize: 12, fontWeight: 600, color: '#44403C', marginBottom: 6 }}
                    >
                      {titleCase(t.option)}
                    </p>
                    {t.gains.length > 0 && (
                      <div style={{ marginBottom: 4 }}>
                        <p
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#15803D',
                            marginBottom: 3,
                          }}
                        >
                          Gains
                        </p>
                        <ul style={{ margin: 0, paddingLeft: 14 }}>
                          {t.gains.map((g, i) => (
                            <li key={i} style={{ fontSize: 12, color: '#57534E', marginBottom: 2 }}>
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {t.costs.length > 0 && (
                      <div>
                        <p
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#B91C1C',
                            marginBottom: 3,
                          }}
                        >
                          Costs
                        </p>
                        <ul style={{ margin: 0, paddingLeft: 14 }}>
                          {t.costs.map((c, i) => (
                            <li key={i} style={{ fontSize: 12, color: '#57534E', marginBottom: 2 }}>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full explanation (confirmed facts, derived context, assumptions, uncertainty) */}
          {assessment && item.policyOutcome === 'RECOMMEND' && isLatest && (
            <FullExplanation assessment={assessment} />
          )}

          {/* Non-binding notice */}
          {item.policyOutcome === 'RECOMMEND' && (
            <p
              style={{
                fontSize: 11,
                color: '#A8A29E',
                marginTop: 12,
                lineHeight: 1.5,
                borderTop: '1px solid rgba(249,115,22,0.08)',
                paddingTop: 10,
              }}
            >
              This recommendation is non-binding. Future Me cannot record your final choice. The decision is yours.
            </p>
          )}
        </div>

        {/* Suggestion chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, justifyContent: 'flex-end' }}>
          {SUGGESTION_CHIPS.map((chip) => (
            <span
              key={chip}
              style={{
                fontSize: 12,
                color: '#C2410C',
                background: 'rgba(249,115,22,0.08)',
                border: '1px solid rgba(249,115,22,0.18)',
                padding: '5px 12px',
                borderRadius: 999,
                cursor: 'default',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContextKV({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div>
      <p style={{ fontSize: 10, color: '#A8A29E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        {label}
      </p>
      {badge ? (
        <span
          style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 999, display: 'inline-block' }}
          className={badge}
        >
          {value}
        </span>
      ) : (
        <p style={{ fontSize: 13, fontWeight: 500, color: '#1C1917' }}>{value}</p>
      )}
    </div>
  );
}

function FullExplanation({ assessment }: { assessment: DecisionApiResponse['assessment'] }) {
  if (!assessment) return null;

  const confirmed = assessment.evidence.filter(
    (e) => e.source === 'user-confirmed' || e.source === 'provided'
  );
  const derived = assessment.evidence.filter(
    (e) => e.source === 'calculated' || e.source === 'estimated' || e.source === 'context'
  );

  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 10,
        border: '1px solid rgba(249,115,22,0.10)',
        overflow: 'hidden',
      }}
    >
      <ExplainSection title="Confirmed facts">
        {confirmed.length === 0 ? (
          <p style={{ fontSize: 12, color: '#A8A29E' }}>No confirmed facts.</p>
        ) : (
          confirmed.map((item, i) => (
            <EvidenceRow key={i} fact={item.fact} value={String(item.value)} source={item.source} explanation={item.explanation} />
          ))
        )}
      </ExplainSection>
      <ExplainSection title="Derived context">
        {derived.length === 0 ? (
          <p style={{ fontSize: 12, color: '#A8A29E' }}>No derived context.</p>
        ) : (
          derived.map((item, i) => (
            <EvidenceRow key={i} fact={item.fact} value={String(item.value)} source={item.source} explanation={item.explanation} />
          ))
        )}
      </ExplainSection>
      <ExplainSection title="Assumptions">
        {assessment.assumptions.length === 0 ? (
          <p style={{ fontSize: 12, color: '#A8A29E' }}>No assumptions were reported.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {assessment.assumptions.map((a) => (
              <li key={a} style={{ fontSize: 12, color: '#44403C', marginBottom: 3 }}>
                {a}
              </li>
            ))}
          </ul>
        )}
      </ExplainSection>
      <ExplainSection title="Uncertainty" noBorder>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#57534E', marginBottom: 4 }}>Missing Data</p>
        {assessment.missingData.length === 0 ? (
          <p style={{ fontSize: 12, color: '#A8A29E', marginBottom: 8 }}>No missing data.</p>
        ) : (
          <ul style={{ margin: '0 0 8px', paddingLeft: 16 }}>
            {assessment.missingData.map((m) => (
              <li key={m} style={{ fontSize: 12, color: '#44403C' }}>{m}</li>
            ))}
          </ul>
        )}
        <p style={{ fontSize: 11, fontWeight: 600, color: '#57534E', marginBottom: 4 }}>Invalid Inputs</p>
        {assessment.invalidInputs.length === 0 ? (
          <p style={{ fontSize: 12, color: '#A8A29E' }}>No invalid inputs.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {assessment.invalidInputs.map((m) => (
              <li key={m} style={{ fontSize: 12, color: '#44403C' }}>{m}</li>
            ))}
          </ul>
        )}
      </ExplainSection>
    </div>
  );
}

function ExplainSection({
  title,
  children,
  noBorder,
}: {
  title: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderBottom: noBorder ? 'none' : '1px solid rgba(249,115,22,0.08)',
      }}
    >
      <h3
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: '#92400E',
          marginBottom: 6,
          margin: '0 0 6px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function EvidenceRow({
  fact,
  value,
  source,
  explanation,
}: {
  fact: string;
  value: string;
  source: string;
  explanation: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1C1917' }}>{fact}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1C1917' }}>:</span>
        <span style={{ fontSize: 12, color: '#44403C', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span
          style={{
            fontSize: 10,
            color: '#A8A29E',
            background: 'rgba(120,80,40,0.06)',
            padding: '1px 6px',
            borderRadius: 999,
          }}
        >
          {source}
        </span>
      </div>
      {explanation && (
        <p style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>{explanation}</p>
      )}
    </div>
  );
}

function ClarificationBlock({
  item,
  isActive,
  clarificationAnswers,
  onAnswerChange,
  onSubmit,
  onSkip,
  isLoading,
}: {
  item: ConversationItem & { type: 'clarification_request' };
  isActive: boolean;
  clarificationAnswers: Record<string, string>;
  onAnswerChange: (field: string, value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onSkip: () => void;
  isLoading: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
      <div
        style={{
          maxWidth: '85%',
          width: '100%',
          background: 'rgba(255,253,235,0.9)',
          border: '1px solid rgba(245,158,11,0.22)',
          borderRadius: '4px 18px 18px 18px',
          padding: '16px 18px',
          boxShadow: '0 2px 12px rgba(120,80,40,0.05)',
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#92400E',
            marginBottom: 6,
          }}
        >
          Needs your input
        </p>
        <p style={{ fontSize: 14, color: '#44403C', lineHeight: 1.5, marginBottom: 14 }}>
          {item.reason}
        </p>

        {item.conflicts.length > 0 && (
          <div
            style={{
              borderRadius: 10,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              padding: '10px 12px',
              marginBottom: 14,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
              Please resolve the following conflicts:
            </p>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {item.conflicts.map((c, i) => (
                <li key={i} style={{ fontSize: 12, color: '#78350F', marginBottom: 2 }}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isActive && (
          <form onSubmit={onSubmit}>
            {item.fields.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {item.fields.map((field) => {
                  const def = FIELD_DEFINITIONS[field] || { label: field, type: 'text' };
                  return (
                    <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#57534E' }}>
                        {def.label}
                      </span>
                      <input
                        type={def.type}
                        min={def.min}
                        max={def.max}
                        step={def.step}
                        aria-label={field}
                        value={clarificationAnswers[field] || ''}
                        onChange={(e) => onAnswerChange(field, e.target.value)}
                        style={{
                          borderRadius: 8,
                          border: '1px solid rgba(249,115,22,0.2)',
                          padding: '7px 10px',
                          fontSize: 14,
                          color: '#1C1917',
                          background: '#FFFFFF',
                          outline: 'none',
                          maxWidth: 240,
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#F97316',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                Re-assess with Clarifications
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={onSkip}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(249,115,22,0.2)',
                  background: '#FFFFFF',
                  color: '#78716C',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                I'm not sure / continue without resolving
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ErrorBubble({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <div
        style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '10px 14px',
          maxWidth: '80%',
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, color: '#B91C1C', marginBottom: 2 }}>
          Request failed
        </p>
        <p style={{ fontSize: 13, color: '#7F1D1D' }}>{text}</p>
      </div>
    </div>
  );
}

function StaleContextNotice({
  onReassess,
  isLoading,
}: {
  onReassess: () => void;
  isLoading: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <div
        style={{
          background: 'rgba(253,230,138,0.3)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 12,
          padding: '12px 16px',
          maxWidth: '85%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ fontSize: 13, color: '#92400E' }}>
          Context changed. Your current result is stale.
        </p>
        <button
          type="button"
          onClick={onReassess}
          disabled={isLoading}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid rgba(249,115,22,0.3)',
            background: 'rgba(249,115,22,0.1)',
            color: '#C2410C',
            fontSize: 12,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          Re-assess same decision
        </button>
      </div>
    </div>
  );
}

function ReassessmentComparison({
  item,
}: {
  item: ConversationItem & { type: 'reassessment_comparison' };
}) {
  const { beforeResult, afterResult } = item;
  const beforeRec = beforeResult.decision?.recommendation;
  const afterRec = afterResult.decision?.recommendation;
  const beforeAssessment = beforeResult.assessment;
  const afterAssessment = afterResult.assessment;

  const hasChangedRecommendation =
    beforeResult.policy.outcome !== afterResult.policy.outcome ||
    beforeRec?.option !== afterRec?.option;

  const changedEvidence =
    beforeAssessment && afterAssessment
      ? afterAssessment.evidence.filter((e) => {
          const beforeEv = beforeAssessment.evidence.find((be) => be.fact === e.fact);
          return (
            !beforeEv ||
            beforeEv.value !== e.value ||
            beforeEv.source !== e.source ||
            beforeEv.explanation !== e.explanation
          );
        })
      : [];

  const removedEvidence =
    beforeAssessment && afterAssessment
      ? beforeAssessment.evidence.filter(
          (be) => !afterAssessment.evidence.some((e) => e.fact === be.fact)
        )
      : [];

  return (
    <div
      style={{
        margin: '4px 0 16px',
        borderRadius: 12,
        border: `1px solid ${hasChangedRecommendation ? 'rgba(34,197,94,0.25)' : 'rgba(59,130,246,0.2)'}`,
        background: hasChangedRecommendation ? 'rgba(34,197,94,0.04)' : 'rgba(59,130,246,0.04)',
        padding: '14px 16px',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#78716C',
          marginBottom: 10,
        }}
      >
        Assessment Updated
      </p>
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: hasChangedRecommendation ? '#15803D' : '#1D4ED8',
          marginBottom: 10,
        }}
      >
        {hasChangedRecommendation ? 'Recommendation changed' : 'Recommendation unchanged'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            borderRadius: 10,
            border: '1px solid rgba(120,80,40,0.10)',
            padding: '10px 12px',
            background: 'rgba(120,80,40,0.04)',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', marginBottom: 6 }}>Before</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#44403C', marginBottom: 4 }}>
            {titleCase(beforeResult.policy.outcome)} — {titleCase(beforeRec?.option || 'No recommendation')}
          </p>
          <p style={{ fontSize: 12, color: '#78716C', lineHeight: 1.4 }}>
            {beforeRec?.reasoning || beforeResult.policy.reason}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: '#A8A29E' }}>
              Feasibility: {titleCase(beforeAssessment?.feasibility || '')}
            </span>
            <span style={{ fontSize: 10, color: '#A8A29E' }}>
              Confidence: {beforeRec?.confidence !== undefined ? `${Math.round(beforeRec.confidence * 100)}%` : 'N/A'}
            </span>
          </div>
        </div>
        <div
          style={{
            borderRadius: 10,
            border: `1px solid ${hasChangedRecommendation ? 'rgba(34,197,94,0.25)' : 'rgba(59,130,246,0.2)'}`,
            padding: '10px 12px',
            background: hasChangedRecommendation ? 'rgba(34,197,94,0.06)' : 'rgba(59,130,246,0.06)',
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: hasChangedRecommendation ? '#15803D' : '#1D4ED8',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            After
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#44403C', marginBottom: 4 }}>
            {titleCase(afterResult.policy.outcome)} — {titleCase(afterRec?.option || 'No recommendation')}
          </p>
          <p style={{ fontSize: 12, color: '#78716C', lineHeight: 1.4 }}>
            {afterRec?.reasoning || afterResult.policy.reason}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: '#A8A29E' }}>
              Feasibility: {titleCase(afterAssessment?.feasibility || '')}
            </span>
            <span style={{ fontSize: 10, color: '#A8A29E' }}>
              Confidence: {afterRec?.confidence !== undefined ? `${Math.round(afterRec.confidence * 100)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {(changedEvidence.length > 0 || removedEvidence.length > 0) ? (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#44403C', marginBottom: 6 }}>Evidence delta:</p>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {changedEvidence.map((ev) => {
              const beforeEv = beforeAssessment?.evidence.find((be) => be.fact === ev.fact);
              return (
                <li key={`changed-${ev.fact}`} style={{ fontSize: 12, color: '#57534E', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: '#1C1917' }}>{ev.fact}:</span>{' '}
                  {beforeEv
                    ? `Changed from ${String(beforeEv.value)} (${beforeEv.source}) -> ${String(ev.value)} (${ev.source})`
                    : `Added: ${String(ev.value)} (${ev.source})`}
                </li>
              );
            })}
            {removedEvidence.map((ev) => (
              <li
                key={`removed-${ev.fact}`}
                style={{ fontSize: 12, color: '#A8A29E', textDecoration: 'line-through', marginBottom: 3 }}
              >
                <span style={{ fontWeight: 600 }}>{ev.fact}:</span> Removed {String(ev.value)} ({ev.source})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#A8A29E' }}>
          No material evidence change was returned; compare the reasoning above.
        </p>
      )}
    </div>
  );
}

function ObservationSubmittedBubble({ description }: { description: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <div
        style={{
          background: 'rgba(249,115,22,0.05)',
          border: '1px solid rgba(249,115,22,0.14)',
          borderRadius: 10,
          padding: '8px 14px',
          maxWidth: '70%',
        }}
      >
        <p style={{ fontSize: 11, color: '#A8A29E', fontStyle: 'italic' }}>
          Context change reported: {description}
        </p>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 14px',
          borderRadius: '4px 18px 18px 18px',
          background: '#FFFFFF',
          border: '1px solid rgba(249,115,22,0.13)',
          boxShadow: '0 2px 8px rgba(120,80,40,0.05)',
        }}
      >
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'rgba(249,115,22,0.5)',
              animation: `bounce 1s ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes bounce {
            0%,100%{transform:translateY(0)}
            50%{transform:translateY(-5px)}
          }
        `}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Observation panel (floating, anchored to composer)
// ─────────────────────────────────────────────

function ObservationPanel({
  form,
  onChange,
  onSubmit,
  onClose,
  isLoading,
}: {
  form: ObservationForm;
  onChange: (field: keyof ObservationForm, value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    borderRadius: 8,
    border: '1px solid rgba(249,115,22,0.2)',
    padding: '7px 10px',
    fontSize: 13,
    color: '#1C1917',
    background: '#FFFFFF',
    outline: 'none',
    width: '100%',
  };

  return (
    <div
      style={{
        borderRadius: 14,
        background: '#FFFBF5',
        border: '1px solid rgba(249,115,22,0.18)',
        padding: '16px 18px',
        marginBottom: 10,
        boxShadow: '0 4px 20px rgba(120,80,40,0.08)',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1917' }}>Report Context Change</p>
        <button
          type="button"
          onClick={onClose}
          style={{ fontSize: 16, color: '#A8A29E', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Category
          </span>
          <select
            aria-label="Change category"
            value={form.category}
            onChange={(e) => onChange('category', e.target.value)}
            style={inputStyle}
          >
            <option value="workload-increase">Workload increase</option>
            <option value="energy-decrease">Energy decrease</option>
            <option value="deadline-change">Deadline change</option>
            <option value="disruption">Disruption</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Description
          </span>
          <textarea
            aria-label="Description"
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={2}
            required
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Severity
          </span>
          <select
            aria-label="Severity"
            value={form.severity}
            onChange={(e) => onChange('severity', e.target.value)}
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#F97316',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          Submit Observation
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// Advanced context panel
// ─────────────────────────────────────────────

function AdvancedContextPanel({
  profile,
  onChange,
}: {
  profile: ImpactProfile;
  onChange: (field: keyof ImpactProfile, value: string) => void;
}) {
  const inputStyle: React.CSSProperties = {
    borderRadius: 8,
    border: '1px solid rgba(249,115,22,0.15)',
    padding: '6px 10px',
    fontSize: 13,
    color: '#1C1917',
    background: '#FFFFFF',
    outline: 'none',
    width: '100%',
  };

  return (
    <div
      style={{
        borderRadius: 12,
        background: 'rgba(249,115,22,0.03)',
        border: '1px solid rgba(249,115,22,0.10)',
        padding: '14px 16px',
        marginBottom: 8,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#A8A29E',
          marginBottom: 12,
        }}
      >
        Advanced context (optional)
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
        {(
          [
            ['target', 'Decision target', 'text'],
            ['deadline', 'Deadline', 'datetime-local'],
            ['timeCostHours', 'Time cost (h)', 'number'],
            ['availableHoursBeforeDeadline', 'Available time (h)', 'number'],
            ['workloadHoursBeforeDeadline', 'Existing workload (h)', 'number'],
            ['energyCost', 'Energy cost (0–10)', 'number'],
            ['availableEnergy', 'Available energy (0–10)', 'number'],
          ] as Array<[keyof ImpactProfile, string, string]>
        ).map(([field, label, type]) => (
          <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 11, color: '#78716C', fontWeight: 500 }}>{label}</span>
            <input
              type={type}
              value={profile[field] as string}
              onChange={(e) => onChange(field, e.target.value)}
              style={inputStyle}
            />
          </label>
        ))}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, color: '#78716C', fontWeight: 500 }}>Goal relevance</span>
          <select
            value={profile.goalRelevance}
            onChange={(e) => onChange('goalRelevance', e.target.value)}
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, color: '#78716C', fontWeight: 500 }}>Data source</span>
          <select
            value={profile.source}
            onChange={(e) => onChange('source', e.target.value)}
            style={inputStyle}
          >
            <option value="user-confirmed">User confirmed</option>
            <option value="provided">Provided</option>
            <option value="estimated">Estimated</option>
          </select>
        </label>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main DecisionsPage
// ─────────────────────────────────────────────

function DecisionsPage() {
  // ── Preserved state ──
  const [profile, setProfile] = useState<ImpactProfile>(() =>
    readSessionValue('afm_profile', INITIAL_PROFILE)
  );
  const [observationForm, setObservationForm] = useState<ObservationForm>(() =>
    readSessionValue('afm_observationForm', INITIAL_OBSERVATION)
  );
  const [result, setResult] = useState<DecisionApiResponse | null>(() =>
    readSessionValue('afm_result', null)
  );
  const [beforeResult, setBeforeResult] = useState<DecisionApiResponse | null>(() =>
    readSessionValue('afm_beforeResult', null)
  );
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>(() =>
    readSessionValue('afm_clarificationAnswers', {})
  );
  const [hasStaleContext, setHasStaleContext] = useState<boolean>(() =>
    readSessionValue('afm_hasStaleContext', false)
  );
  const [conversation, setConversation] = useState<ConversationItem[]>(() =>
    readSessionValue('afm_conversation', [])
  );

  // ── New UI state ──
  const [composerText, setComposerText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showObservationPanel, setShowObservationPanel] = useState(false);
  const [showAdvancedContext, setShowAdvancedContext] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'chat' | 'history' | 'calendar'>('chat');

  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const { intervention, refresh: refreshInterventions, respond, dismiss } = useInterventions();

  // ── Active history title ──
  const activeConversationTitle =
    conversation.find((c) => c.type === 'user_message')?.text ?? '';

  // ── Session persistence ──
  useEffect(() => sessionStorage.setItem('afm_profile', JSON.stringify(profile)), [profile]);
  useEffect(
    () => sessionStorage.setItem('afm_observationForm', JSON.stringify(observationForm)),
    [observationForm]
  );
  useEffect(() => sessionStorage.setItem('afm_result', JSON.stringify(result)), [result]);
  useEffect(
    () => sessionStorage.setItem('afm_beforeResult', JSON.stringify(beforeResult)),
    [beforeResult]
  );
  useEffect(
    () =>
      sessionStorage.setItem('afm_clarificationAnswers', JSON.stringify(clarificationAnswers)),
    [clarificationAnswers]
  );
  useEffect(
    () => sessionStorage.setItem('afm_hasStaleContext', JSON.stringify(hasStaleContext)),
    [hasStaleContext]
  );
  useEffect(
    () => sessionStorage.setItem('afm_conversation', JSON.stringify(conversation)),
    [conversation]
  );

  // ── Load calendar on mount ──
  useEffect(() => {
    async function loadCalendar() {
      try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const start = now.toISOString();
        const end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59).toISOString();
        const events = await calendarApi.getEvents({ start, end });
        setCalendarEvents(events);
      } catch {
        // graceful empty state — no crash
      } finally {
        setCalendarLoading(false);
      }
    }
    void loadCalendar();
  }, []);

  // ── Auto-scroll thread ──
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [conversation, isLoading]);

  // ── Toast helper ──
  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // ── New conversation ──
  const handleNewConversation = () => {
    setConversation([]);
    setResult(null);
    setBeforeResult(null);
    setClarificationAnswers({});
    setHasStaleContext(false);
    setProfile(INITIAL_PROFILE);
    setObservationForm(INITIAL_OBSERVATION);
    sessionStorage.removeItem('afm_conversation');
    sessionStorage.removeItem('afm_result');
    sessionStorage.removeItem('afm_beforeResult');
    sessionStorage.removeItem('afm_clarificationAnswers');
    sessionStorage.removeItem('afm_hasStaleContext');
  };

  // ── History item click ──
  const handleHistoryClick = (_text: string) => {
    showToast('Previous conversations are not available in this session');
  };

  // ── Map result to conversation items ──
  function appendResultToConversation(
    prev: ConversationItem[],
    _question: string,
    response: DecisionApiResponse
  ): ConversationItem[] {
    const items: ConversationItem[] = [...prev];

    // Build the FM message text
    let text = '';
    if (response.policy.outcome === 'RECOMMEND' && response.decision?.recommendation) {
      text = response.decision.recommendation.reasoning;
    } else if (response.policy.outcome === 'ASK') {
      text = "Let's look at this in the context of your current priorities. I need a bit more information to give you a good answer.";
    } else if (response.policy.outcome === 'ABSTAIN') {
      text = response.policy.reason || "I don't have enough information to make a useful recommendation yet.";
    } else {
      text = response.policy.reason || 'Let me think about this...';
    }

    items.push({
      type: 'future_me_message',
      text,
      timestamp: new Date(),
      policyOutcome: response.policy.outcome,
      result: response,
    });

    if (response.policy.outcome === 'ASK') {
      items.push({
        type: 'clarification_request',
        fields: response.policy.unresolvedMaterialFields || [],
        conflicts: response.policy.unresolvedMaterialConflicts || [],
        reason: response.policy.reason || 'The following information is needed to improve the assessment.',
      });
    }

    return items;
  }

  // ── Submit new question ──
  const handleSubmit = async (event?: FormEvent) => {
    if (event) event.preventDefault();

    const question = composerText.trim();
    if (!question) return;

    const [timeCost, availableHours, workloadHours, energyCostV, availableEnergyV] = [
      optionalNumber(profile.timeCostHours),
      optionalNumber(profile.availableHoursBeforeDeadline),
      optionalNumber(profile.workloadHoursBeforeDeadline),
      optionalNumber(profile.energyCost),
      optionalNumber(profile.availableEnergy),
    ];

    if (
      [timeCost, availableHours, workloadHours, energyCostV, availableEnergyV].some(
        (v) => v !== undefined && v < 0
      )
    ) {
      setConversation((prev) => [
        ...prev,
        { type: 'error', text: 'Numeric values cannot be negative.' },
      ]);
      return;
    }

    const request: DecisionApiRequest = {
      query: {
        question,
        impactProfile: {
          target: profile.target.trim() || undefined,
          deadline: profile.deadline || undefined,
          timeCostHours: timeCost,
          availableHoursBeforeDeadline: availableHours,
          workloadHoursBeforeDeadline: workloadHours,
          energyCost: energyCostV,
          availableEnergy: availableEnergyV,
          goalRelevance: profile.goalRelevance,
          source: profile.source,
        },
      },
    };

    // Append user message
    setConversation((prev) => [
      ...prev,
      { type: 'user_message', text: question, timestamp: new Date() },
    ]);
    setComposerText('');

    const prevResult = result;
    setIsLoading(true);

    try {
      const response = await decisionsApi.query(request);
      setBeforeResult(prevResult);
      setResult(response);
      setHasStaleContext(false);
      setClarificationAnswers({});
      setConversation((prev) => appendResultToConversation(prev, question, response));
    } catch (err) {
      setConversation((prev) => [
        ...prev,
        {
          type: 'error',
          text: err instanceof Error ? err.message : 'Unable to request decision support.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Keyboard submit ──
  const handleComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // ── Clarification submit ──
  const handleClarificationSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitWithClarification(false);
  };

  const submitWithClarification = async (skip: boolean) => {
    if (!result) return;
    const prevResult = result;

    const updatedProfile = { ...profile };
    const unresolvedFields: string[] = [];

    const unresolvedMaterialFields = result.policy.unresolvedMaterialFields || [];
    unresolvedMaterialFields.forEach((field) => {
      if (clarificationAnswers[field] && clarificationAnswers[field].trim() !== '') {
        if (isClarificationField(field)) {
          updatedProfile[field] = clarificationAnswers[field];
        } else {
          unresolvedFields.push(field);
        }
      } else {
        unresolvedFields.push(field);
      }
    });

    if (!skip) {
      const hasNegative = Object.values(clarificationAnswers).some((answer) => {
        const num = optionalNumber(answer);
        return num !== undefined && num < 0;
      });
      if (hasNegative) {
        setConversation((prev) => [
          ...prev,
          { type: 'error', text: 'Numeric values cannot be negative.' },
        ]);
        return;
      }
    }

    setProfile(updatedProfile);

    const request: DecisionApiRequest = {
      query: {
        question: updatedProfile.target || '',
        impactProfile: {
          target: updatedProfile.target.trim() || undefined,
          deadline: updatedProfile.deadline || undefined,
          timeCostHours: optionalNumber(updatedProfile.timeCostHours),
          availableHoursBeforeDeadline: optionalNumber(updatedProfile.availableHoursBeforeDeadline),
          workloadHoursBeforeDeadline: optionalNumber(updatedProfile.workloadHoursBeforeDeadline),
          energyCost: optionalNumber(updatedProfile.energyCost),
          availableEnergy: optionalNumber(updatedProfile.availableEnergy),
          goalRelevance: updatedProfile.goalRelevance,
          source: updatedProfile.source,
        },
        clarification: {
          attempted: true,
          unresolvedFields: skip ? unresolvedMaterialFields : unresolvedFields,
          unresolvedConflicts: result.policy.unresolvedMaterialConflicts,
        },
      },
    };

    setConversation((prev) => [
      ...prev,
      { type: 'user_message', text: 'Providing context...', timestamp: new Date() },
    ]);
    setIsLoading(true);

    try {
      const response = await decisionsApi.query(request);
      setBeforeResult(prevResult);
      setResult(response);
      setClarificationAnswers({});
      setConversation((prev) => {
        const withResult = appendResultToConversation(prev, '', response);
        return [
          ...withResult,
          { type: 'reassessment_comparison', beforeResult: prevResult, afterResult: response },
        ];
      });
    } catch (err) {
      setConversation((prev) => [
        ...prev,
        {
          type: 'error',
          text: err instanceof Error ? err.message : 'Unable to request decision support.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Observation submit ──
  const handleObservationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!observationForm.description.trim()) return;

    const observation: ContextUpdateObservation = {
      type: observationForm.category,
      data: {
        description: observationForm.description,
        severity: observationForm.severity,
      },
      source: 'USER_CONFIRMED' as ObservationSource,
      confidence: 1.0,
    };

    setIsLoading(true);

    try {
      await contextApi.update(observation);
      setShowObservationPanel(false);
      const desc = observationForm.description;
      setObservationForm(INITIAL_OBSERVATION);
      if (result) {
        setHasStaleContext(true);
        setConversation((prev) => [
          ...prev,
          { type: 'stale_context_notice' },
          { type: 'observation_submitted', description: desc, timestamp: new Date() },
        ]);
      }
      await refreshInterventions();
    } catch (err) {
      setConversation((prev) => [
        ...prev,
        {
          type: 'error',
          text: err instanceof Error ? err.message : 'Unable to submit observation.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Re-assess same decision ──
  const handleReassessSameDecision = async () => {
    if (!result) return;

    // Find the last user question
    const lastQuestion = [...conversation].reverse().find((c) => c.type === 'user_message');
    const questionText = lastQuestion?.type === 'user_message' ? lastQuestion.text : '';

    const request: DecisionApiRequest = {
      query: {
        question: questionText,
        impactProfile: {
          target: profile.target.trim() || undefined,
          deadline: profile.deadline || undefined,
          timeCostHours: optionalNumber(profile.timeCostHours),
          availableHoursBeforeDeadline: optionalNumber(profile.availableHoursBeforeDeadline),
          workloadHoursBeforeDeadline: optionalNumber(profile.workloadHoursBeforeDeadline),
          energyCost: optionalNumber(profile.energyCost),
          availableEnergy: optionalNumber(profile.availableEnergy),
          goalRelevance: profile.goalRelevance,
          source: profile.source,
        },
      },
    };

    const prevResult = result;
    setIsLoading(true);

    try {
      const response = await decisionsApi.query(request);
      setBeforeResult(prevResult);
      setResult(response);
      setHasStaleContext(false);
      setClarificationAnswers({});
      setConversation((prev) => {
        const withResult = appendResultToConversation(prev, questionText, response);
        return [
          ...withResult,
          { type: 'reassessment_comparison', beforeResult: prevResult, afterResult: response },
        ];
      });
    } catch (err) {
      setConversation((prev) => [
        ...prev,
        {
          type: 'error',
          text: err instanceof Error ? err.message : 'Unable to reassess decision.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Determine if the most recent clarification_request is still active ──
  const lastClarificationIndex = conversation.reduce<number>(
    (acc, item, i) => (item.type === 'clarification_request' ? i : acc),
    -1
  );
  const lastFutureMeAfterClarification = conversation
    .slice(lastClarificationIndex + 1)
    .some((c) => c.type === 'future_me_message');
  const isClarificationActive =
    lastClarificationIndex >= 0 && !lastFutureMeAfterClarification;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div
      style={{
        background: '#FDFAF7',
        minHeight: 'calc(100vh - 64px)',
        padding: '12px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Responsive CSS — single stylesheet injected once */}
      <style>{`
        .afm-layout {
          display: grid;
          grid-template-columns: 22% 1fr 28%;
          grid-template-rows: 1fr;
          gap: 12px;
          height: calc(100vh - 64px - 24px);
          max-width: 1600px;
          margin: 0 auto;
        }
        .afm-sidebar-left  { display: flex; flex-direction: column; }
        .afm-sidebar-right { display: flex; flex-direction: column; }
        .afm-chat          { display: flex; flex-direction: column; min-width: 0; }
        .afm-mobile-tabs   { display: none; }
        @media (max-width: 1023px) {
          .afm-layout {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            height: calc(100vh - 64px - 24px);
          }
          .afm-sidebar-left  { display: none; }
          .afm-sidebar-right { display: none; }
          .afm-mobile-tabs   { display: flex; }
          .afm-sidebar-left.afm-tab-active  { display: flex; }
          .afm-sidebar-right.afm-tab-active { display: flex; }
        }
      `}</style>

      {/* Intervention card */}
      {intervention && (
        <div style={{ maxWidth: 900, margin: '0 auto 10px' }}>
          <InterventionCard intervention={intervention} onRespond={respond} onDismiss={dismiss} />
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: '#1C1917',
            color: '#FDFAF7',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Mobile tab switcher (hidden on desktop via CSS) */}
      <div
        className="afm-mobile-tabs"
        style={{
          gap: 0,
          marginBottom: 10,
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid rgba(249,115,22,0.12)',
          overflow: 'hidden',
        }}
      >
        {(['chat', 'history', 'calendar'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            style={{
              flex: 1,
              padding: '9px 8px',
              border: 'none',
              background: mobileTab === tab ? 'rgba(249,115,22,0.10)' : 'transparent',
              color: mobileTab === tab ? '#EA580C' : '#78716C',
              fontSize: 13,
              fontWeight: mobileTab === tab ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3-column grid (responsive via CSS above) */}
      <div className="afm-layout">
        {/* Left sidebar */}
        <div
          className={`afm-sidebar-left${mobileTab === 'history' ? ' afm-tab-active' : ''}`}
        >
          <HistorySidebar
            onNewConversation={handleNewConversation}
            activeConversationTitle={activeConversationTitle}
            onHistoryClick={handleHistoryClick}
          />
        </div>

        {/* Center: Main chat — single instance always in DOM */}
        <div
          className="afm-chat"
          style={{ display: mobileTab !== 'chat' ? undefined : undefined }}
        >
          <MainChatPanel
            conversation={conversation}
            isEmpty={conversation.length === 0}
            isLoading={isLoading}
            hasStaleContext={hasStaleContext}
            clarificationAnswers={clarificationAnswers}
            isClarificationActive={isClarificationActive}
            composerText={composerText}
            showObservationPanel={showObservationPanel}
            showAdvancedContext={showAdvancedContext}
            profile={profile}
            observationForm={observationForm}
            threadRef={threadRef}
            composerRef={composerRef}
            onComposerChange={setComposerText}
            onComposerKeyDown={handleComposerKeyDown}
            onSubmit={handleSubmit}
            onClarificationAnswerChange={(field, value) =>
              setClarificationAnswers((prev) => ({ ...prev, [field]: value }))
            }
            onClarificationSubmit={handleClarificationSubmit}
            onClarificationSkip={() => void submitWithClarification(true)}
            onReassess={handleReassessSameDecision}
            onToggleObservation={() => setShowObservationPanel((s) => !s)}
            onToggleAdvanced={() => setShowAdvancedContext((s) => !s)}
            onProfileChange={(field, value) =>
              setProfile((prev) => ({ ...prev, [field]: value }))
            }
            onObservationChange={(field, value) =>
              setObservationForm((prev) => ({ ...prev, [field]: value }))
            }
            onObservationSubmit={handleObservationSubmit}
            onObservationClose={() => setShowObservationPanel(false)}
          />
        </div>

        {/* Right sidebar */}
        <div
          className={`afm-sidebar-right${mobileTab === 'calendar' ? ' afm-tab-active' : ''}`}
        >
          <CalendarPanel events={calendarEvents} loading={calendarLoading} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MainChatPanel (extracted for reuse in mobile/desktop)
// ─────────────────────────────────────────────

interface MainChatPanelProps {
  conversation: ConversationItem[];
  isEmpty: boolean;
  isLoading: boolean;
  hasStaleContext: boolean;
  clarificationAnswers: Record<string, string>;
  isClarificationActive: boolean;
  composerText: string;
  showObservationPanel: boolean;
  showAdvancedContext: boolean;
  profile: ImpactProfile;
  observationForm: ObservationForm;
  threadRef: React.RefObject<HTMLDivElement | null>;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  onComposerChange: (v: string) => void;
  onComposerKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: FormEvent) => void;
  onClarificationAnswerChange: (field: string, value: string) => void;
  onClarificationSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClarificationSkip: () => void;
  onReassess: () => void;
  onToggleObservation: () => void;
  onToggleAdvanced: () => void;
  onProfileChange: (field: keyof ImpactProfile, value: string) => void;
  onObservationChange: (field: keyof ObservationForm, value: string) => void;
  onObservationSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onObservationClose: () => void;
}

function MainChatPanel({
  conversation,
  isEmpty,
  isLoading,
  hasStaleContext,
  clarificationAnswers,
  isClarificationActive,
  composerText,
  showObservationPanel,
  showAdvancedContext,
  profile,
  observationForm,
  threadRef,
  composerRef,
  onComposerChange,
  onComposerKeyDown,
  onSubmit,
  onClarificationAnswerChange,
  onClarificationSubmit,
  onClarificationSkip,
  onReassess,
  onToggleObservation,
  onToggleAdvanced,
  onProfileChange,
  onObservationChange,
  onObservationSubmit,
  onObservationClose,
}: MainChatPanelProps) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 4px 16px rgba(120,80,40,0.06)',
        border: '1px solid rgba(249,115,22,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid rgba(249,115,22,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(249,115,22,0.025)',
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1C1917',
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: 2,
            }}
          >
            Future Me
          </h1>
          <p style={{ fontSize: 12, color: '#A8A29E', margin: 0 }}>
            Your context-aware decision companion
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={onToggleObservation}
            title="Report a context change"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(249,115,22,0.2)',
              background: showObservationPanel ? 'rgba(249,115,22,0.10)' : 'transparent',
              color: '#78716C',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Add Context Change
          </button>
        </div>
      </div>

      {/* Thread */}
      <div
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px 8px',
        }}
      >
        {/* Empty state */}
        {isEmpty && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              paddingBottom: 40,
              textAlign: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(249,115,22,0.10)',
                border: '2px solid rgba(249,115,22,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: '#EA580C' }}>FM</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1C1917' }}>Ask Future Me</p>
            <p style={{ fontSize: 14, color: '#A8A29E', maxWidth: 320, lineHeight: 1.5 }}>
              Ask about a decision and I'll reason through it using your current goals, schedule, and commitments.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {[
                'Should I join the hackathon?',
                'Can I take this project on?',
                'Is now a good time to...',
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => onComposerChange(ex)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(249,115,22,0.18)',
                    background: 'rgba(249,115,22,0.06)',
                    color: '#C2410C',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {(() => {
          const lastFmIdx = conversation.reduce<number>(
            (acc, item, i) => (item.type === 'future_me_message' ? i : acc),
            -1
          );
          return conversation.map((item, idx) => {
          if (item.type === 'user_message') {
            return <UserMessageBubble key={idx} text={item.text} timestamp={item.timestamp} />;
          }
          if (item.type === 'future_me_message') {
            return <FutureMeCard key={idx} item={item} isLatest={idx === lastFmIdx} />;
          }
          if (item.type === 'clarification_request') {
            return (
              <ClarificationBlock
                key={idx}
                item={item}
                isActive={isClarificationActive && idx === conversation.reduce((a, c, i) => (c.type === 'clarification_request' ? i : a), -1)}
                clarificationAnswers={clarificationAnswers}
                onAnswerChange={onClarificationAnswerChange}
                onSubmit={onClarificationSubmit}
                onSkip={onClarificationSkip}
                isLoading={isLoading}
              />
            );
          }
          if (item.type === 'stale_context_notice') {
            return (
              <StaleContextNotice key={idx} onReassess={onReassess} isLoading={isLoading} />
            );
          }
          if (item.type === 'observation_submitted') {
            return <ObservationSubmittedBubble key={idx} description={item.description} />;
          }
          if (item.type === 'reassessment_comparison') {
            return <ReassessmentComparison key={idx} item={item} />;
          }
          if (item.type === 'error') {
            return <ErrorBubble key={idx} text={item.text} />;
          }
          return null;
          });
        })()}

        {/* Stale context (if not yet in conversation) */}
        {hasStaleContext && !conversation.some((c) => c.type === 'stale_context_notice') && (
          <StaleContextNotice onReassess={onReassess} isLoading={isLoading} />
        )}

        {/* Thinking indicator */}
        {isLoading && <ThinkingIndicator />}
      </div>

      {/* Composer area */}
      <div
        style={{
          padding: '10px 14px 14px',
          borderTop: '1px solid rgba(249,115,22,0.08)',
          background: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        {/* Observation panel */}
        {showObservationPanel && (
          <ObservationPanel
            form={observationForm}
            onChange={onObservationChange}
            onSubmit={onObservationSubmit}
            onClose={onObservationClose}
            isLoading={isLoading}
          />
        )}

        {/* Advanced context panel */}
        {showAdvancedContext && (
          <AdvancedContextPanel profile={profile} onChange={onProfileChange} />
        )}

        {/* Composer row */}
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(e); }}
          style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <label
              htmlFor="decision-query"
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                clip: 'rect(0,0,0,0)',
                whiteSpace: 'nowrap',
              }}
            >
              What decision do you need help with?
            </label>
            <textarea
              id="decision-query"
              ref={composerRef}
              value={composerText}
              onChange={(e) => onComposerChange(e.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder="Ask anything about your decisions..."
              rows={2}
              style={{
                width: '100%',
                borderRadius: 14,
                border: '1.5px solid rgba(249,115,22,0.18)',
                padding: '11px 14px',
                fontSize: 15,
                color: '#1C1917',
                background: '#FDFAF7',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.40)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.18)';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <button
              type="submit"
              disabled={isLoading || !composerText.trim()}
              aria-label="Ask Future Me"
              style={{
                padding: '11px 18px',
                borderRadius: 12,
                border: 'none',
                background:
                  isLoading || !composerText.trim()
                    ? 'rgba(249,115,22,0.4)'
                    : '#F97316',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  isLoading || !composerText.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.5)',
                      borderTopColor: '#FFFFFF',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  Asking…
                </>
              ) : (
                'Ask Future Me'
              )}
            </button>
            <button
              type="button"
              onClick={onToggleAdvanced}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                border: '1px solid rgba(249,115,22,0.15)',
                background: showAdvancedContext ? 'rgba(249,115,22,0.08)' : 'transparent',
                color: '#A8A29E',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {showAdvancedContext ? 'Hide context' : '+ Context'}
            </button>
          </div>
        </form>

        <p style={{ fontSize: 11, color: '#D1C8BF', marginTop: 6, paddingLeft: 4 }}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </section>
  );
}

export default DecisionsPage;
