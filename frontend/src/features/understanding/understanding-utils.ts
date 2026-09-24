import type { PersonalContext, UnderstandingHistoryResponse, UnderstandingHistoryPoint } from '../../types/domain';

export interface CategoryStatItem {
  id: 'goals' | 'commitments' | 'preferences' | 'decisions';
  label: string;
  count: number;
  color: string;
  barColor: string;
  colorClass: string;
}

export interface CategoryBreakdown {
  total: number;
  isEmpty: boolean;
  items: CategoryStatItem[];
}

export function calculateCategoryBreakdown(
  context: PersonalContext | null,
  history?: UnderstandingHistoryResponse | null
): CategoryBreakdown {
  const goalsCount = context?.goals?.length ?? 0;
  const commitmentsCount = context?.commitments?.length ?? 0;
  const preferencesCount = context?.preferences?.length ?? 0;
  const decisionsCount =
    history?.points && history.points.length > 0
      ? history.points[history.points.length - 1]!.decisions
      : (context?.recentDecisions?.length ?? 0);

  const total = goalsCount + commitmentsCount + preferencesCount + decisionsCount;

  const items: CategoryStatItem[] = [
    {
      id: 'goals',
      label: 'Goals',
      count: goalsCount,
      color: '#D97706',
      barColor: '#D97706',
      colorClass: 'text-amber-800 bg-amber-500/10 border-amber-300/40',
    },
    {
      id: 'commitments',
      label: 'Commitments',
      count: commitmentsCount,
      color: '#E11D48',
      barColor: '#E11D48',
      colorClass: 'text-rose-800 bg-rose-500/10 border-rose-300/40',
    },
    {
      id: 'preferences',
      label: 'Preferences',
      count: preferencesCount,
      color: '#0D9488',
      barColor: '#0D9488',
      colorClass: 'text-teal-800 bg-teal-500/10 border-teal-300/40',
    },
    {
      id: 'decisions',
      label: 'Decisions',
      count: decisionsCount,
      color: '#7C3AED',
      barColor: '#7C3AED',
      colorClass: 'text-purple-800 bg-purple-500/10 border-purple-300/40',
    },
  ];

  if (!context && (!history || !history.points || history.points.length === 0)) {
    return { total: 0, isEmpty: true, items: [] };
  }

  return {
    total,
    isEmpty: total === 0,
    items,
  };
}

export interface LearnedInsight {
  id: string;
  category: 'goals' | 'commitments' | 'preferences' | 'decisions' | 'lifecycle';
  title: string;
  detail: string;
  sourceLabel: string;
  sourceNote?: string;
}

export function deriveLearnedInsights(
  context: PersonalContext | null,
  history: UnderstandingHistoryResponse | null
): LearnedInsight[] {
  if (!context && (!history || !history.points || history.points.length === 0)) return [];

  const insights: LearnedInsight[] = [];
  const goals = context?.goals ?? [];
  const commitments = context?.commitments ?? [];
  const preferences = context?.preferences ?? [];
  const decisions = context?.recentDecisions ?? [];

  // 1. Expiry changes in history window (Requirement 4: Explain expiry changes when present in the selected history window)
  if (history?.points && history.points.length > 0) {
    const expiredChanges = history.points.flatMap((pt) =>
      pt.changes.filter((change) => change.direction === 'expired')
    );
    const expiredCount = expiredChanges.length;
    const expiredLabels: string[] = [];
    for (const change of expiredChanges) {
      if (change.label && expiredLabels.length < 2) {
        expiredLabels.push(change.label);
      }
    }

    if (expiredCount > 0) {
      const normalizedSources = expiredChanges.map((change) => change.source.toLowerCase());
      const sourceLabel = normalizedSources.every((source) => source.includes('calendar') || source === 'cal')
        ? 'From Calendar'
        : normalizedSources.every((source) => source.includes('user') || source.includes('confirmed'))
          ? 'User confirmed'
          : normalizedSources.every((source) => source.includes('inferred') || source.includes('pattern'))
            ? 'Inferred'
            : 'Context history';

      insights.push({
        id: 'insight-lifecycle-expiry',
        category: 'lifecycle',
        title: `${expiredCount} Context Record${expiredCount > 1 ? 's' : ''} Expired Naturally`,
        detail: `${expiredCount === 1 ? 'A previously valid context record reached its validity boundary' : 'Previously valid context records reached their validity boundaries'}. The timeline decreases because only currently valid records are counted; Future Me has not inferred that it forgot you.`,
        sourceLabel,
        sourceNote: expiredLabels.length > 0 ? `e.g. ${expiredLabels.join(', ')}` : 'Context validity history',
      });
    }
  }

  // 2. Goal Insight
  if (goals.length > 0) {
    const highPriorityGoals = goals.filter((g) => g.priority === 'high');
    const confirmedGoals = goals.filter((g) => g.source === 'USER_CONFIRMED');
    const inferredGoals = goals.filter((g) => g.source === 'SYSTEM_INFERRED' || g.source === 'HISTORICAL_PATTERN');

    let sourceLabel = 'User confirmed';
    if (confirmedGoals.length === goals.length) {
      sourceLabel = 'User confirmed';
    } else if (inferredGoals.length === goals.length) {
      sourceLabel = 'Inferred';
    } else {
      sourceLabel = 'Inferred';
    }

    insights.push({
      id: 'insight-goals',
      category: 'goals',
      title: `${goals.length} Active Goal${goals.length > 1 ? 's' : ''} Tracked`,
      detail: highPriorityGoals.length > 0
        ? `${highPriorityGoals.length} high priority goal${highPriorityGoals.length > 1 ? 's' : ''} currently guiding your schedule focus.`
        : 'All current goals prioritized evenly across your daily intentions.',
      sourceLabel,
      sourceNote: confirmedGoals.length === goals.length
        ? 'All confirmed directly by you'
        : `${confirmedGoals.length} user confirmed, ${goals.length - confirmedGoals.length} inferred`,
    });
  }

  // 3. Preferences Insight
  if (preferences.length > 0) {
    const categories = Array.from(new Set(preferences.map((p) => p.category).filter(Boolean)));
    const inferredPrefs = preferences.filter((p) => p.source === 'SYSTEM_INFERRED' || p.source === 'HISTORICAL_PATTERN');
    const confirmedPrefs = preferences.filter((p) => p.source === 'USER_CONFIRMED');

    let sourceLabel = 'User confirmed';
    let sourceNote = 'Explicit preferences confirmed by you';
    if (inferredPrefs.length > 0 && confirmedPrefs.length === 0) {
      sourceLabel = 'Inferred';
      sourceNote = 'Inferred from observed context signals';
    } else if (inferredPrefs.length > 0) {
      sourceLabel = 'Inferred';
      sourceNote = `${confirmedPrefs.length} confirmed, ${inferredPrefs.length} inferred`;
    }

    insights.push({
      id: 'insight-preferences',
      category: 'preferences',
      title: `${preferences.length} Learned Preference${preferences.length > 1 ? 's' : ''}`,
      detail: categories.length > 0
        ? `Covers habits across ${categories.join(', ')}.`
        : 'Informing communication and workload trade-offs.',
      sourceLabel,
      sourceNote,
    });
  }

  // 4. Commitments Insight
  if (commitments.length > 0) {
    const calendarCommitments = commitments.filter((c) => c.source === 'CALENDAR');
    const recurringCommitments = commitments.filter((c) => Boolean(c.recurring));
    const confirmedCommitments = commitments.filter((c) => c.source === 'USER_CONFIRMED');

    let sourceLabel = 'User confirmed';
    if (calendarCommitments.length > 0) {
      sourceLabel = 'From Calendar';
    } else if (confirmedCommitments.length === commitments.length) {
      sourceLabel = 'User confirmed';
    } else {
      sourceLabel = 'Inferred';
    }

    insights.push({
      id: 'insight-commitments',
      category: 'commitments',
      title: `${commitments.length} Active Commitment${commitments.length > 1 ? 's' : ''}`,
      detail: calendarCommitments.length > 0
        ? `${calendarCommitments.length} synced with your calendar.${recurringCommitments.length > 0 ? ` ${recurringCommitments.length} recurring schedule block${recurringCommitments.length > 1 ? 's' : ''}.` : ''}`
        : 'Sourced from personal declarations and schedule check-ins.',
      sourceLabel,
      sourceNote: calendarCommitments.length > 0
        ? 'Derived from available calendar data'
        : confirmedCommitments.length === commitments.length
          ? 'Confirmed directly by you'
          : 'Inferred from observed context signals',
    });
  }

  // 5. Decisions fallback if under 3
  if (insights.length < 3 && decisions.length > 0) {
    insights.push({
      id: 'insight-decisions',
      category: 'decisions',
      title: `${decisions.length} Recent Decision${decisions.length > 1 ? 's' : ''} Evaluated`,
      detail: 'Past decision trade-offs and recommendations preserved for context.',
      sourceLabel: 'Decision history',
      sourceNote: 'Decision engine activity log',
    });
  }

  // Cap at 1-3 deterministic items
  return insights.slice(0, 3);
}

export interface ChartSeriesData {
  name: 'Goals' | 'Commitments' | 'Preferences' | 'Decisions';
  color: string;
  points: { x: number; y: number; value: number }[];
  pathD: string;
}

export interface ChartLayout {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  plotWidth: number;
  plotHeight: number;
  maxValue: number;
  yTicks: { value: number; y: number }[];
  xTicks: { index: number; label: string; x: number; date: string }[];
  series: ChartSeriesData[];
}

export function computeLineChartLayout(
  points: UnderstandingHistoryPoint[],
  width = 600,
  height = 240
): ChartLayout {
  const padding = { top: 20, right: 24, bottom: 36, left: 36 };
  const plotWidth = Math.max(10, width - padding.left - padding.right);
  const plotHeight = Math.max(10, height - padding.top - padding.bottom);

  if (points.length === 0) {
    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      maxValue: 1,
      yTicks: [{ value: 0, y: padding.top + plotHeight }],
      xTicks: [],
      series: [],
    };
  }

  // Find max value across all four series
  let rawMax = 1;
  for (const pt of points) {
    rawMax = Math.max(rawMax, pt.goals, pt.commitments, pt.preferences, pt.decisions);
  }

  // Round up to nice integer
  const maxValue = Math.max(4, Math.ceil(rawMax * 1.15));

  // Compute 4 y-ticks
  const yTickCount = 4;
  const yTicks: { value: number; y: number }[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    const val = Math.round((maxValue / yTickCount) * i);
    const y = padding.top + plotHeight - (val / maxValue) * plotHeight;
    yTicks.push({ value: val, y });
  }

  // Compute X ticks (limit X labels to max 4 universally)
  const xTickIndices = selectEvenTickIndices(points.length, Math.min(4, points.length));
  const xTicks = xTickIndices.map((idx) => {
    const pt = points[idx]!;
    const x = padding.left + (idx / Math.max(1, points.length - 1)) * plotWidth;
    return {
      index: idx,
      date: pt.date,
      label: formatShortDate(pt.date),
      x,
    };
  });

  const seriesNames: Array<{
    key: 'goals' | 'commitments' | 'preferences' | 'decisions';
    label: 'Goals' | 'Commitments' | 'Preferences' | 'Decisions';
    color: string;
  }> = [
    { key: 'goals', label: 'Goals', color: '#D97706' }, // Amber
    { key: 'commitments', label: 'Commitments', color: '#E11D48' }, // Rose
    { key: 'preferences', label: 'Preferences', color: '#0D9488' }, // Teal
    { key: 'decisions', label: 'Decisions', color: '#7C3AED' }, // Violet/Purple
  ];

  const series: ChartSeriesData[] = seriesNames.map(({ key, label, color }) => {
    const pts = points.map((pt, i) => {
      const val = pt[key];
      const x = padding.left + (i / Math.max(1, points.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - (val / maxValue) * plotHeight;
      return { x, y, value: val };
    });

    const pathD = buildPolylinePath(pts);

    return {
      name: label,
      color,
      points: pts,
      pathD,
    };
  });

  return {
    width,
    height,
    padding,
    plotWidth,
    plotHeight,
    maxValue,
    yTicks,
    xTicks,
    series,
  };
}

function selectEvenTickIndices(totalPoints: number, targetTicks: number): number[] {
  if (totalPoints <= 1) return [0];
  if (totalPoints <= targetTicks) {
    return Array.from({ length: totalPoints }, (_, i) => i);
  }
  const indices: number[] = [];
  const step = (totalPoints - 1) / (targetTicks - 1);
  for (let i = 0; i < targetTicks; i++) {
    indices.push(Math.round(i * step));
  }
  return Array.from(new Set(indices));
}

function buildPolylinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  return pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
}

export function formatShortDate(dateStr: string): string {
  try {
    const [, month, day] = dateStr.split('-');
    if (!month || !day) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(month, 10) - 1] ?? month;
    return `${monthName} ${parseInt(day, 10)}`;
  } catch {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently';
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return date.toLocaleDateString();

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}
