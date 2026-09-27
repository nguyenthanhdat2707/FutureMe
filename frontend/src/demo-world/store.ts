import { createDemoWorldBaseline, DEMO_WORLD_STORAGE_KEY, DEMO_WORLD_VERSION } from './baseline';
import type { ActiveDecision, Alternative, CalendarEvent, DemoWorld, DemoWorldAction, PlanProposal, StorageAdapter } from './types';

const expectedOutcomeOptions = [
  { id:'meaningful-limited', label:'I want to contribute meaningfully, even if my involvement is limited.' },
  { id:'full-two-weeks', label:'I want to stay actively involved throughout the full two weeks.' },
  { id:'relationship', label:'Building the relationship and supporting the team matters most.' },
  { id:'something-else', label:'Something else...' },
];
const flexibilityOptions = [
  { id:'scope-and-schedule-adjustable', label:'The scope and schedule can be adjusted.' },
  { id:'schedule-adjustable', label:'The schedule can change, but meaningful involvement is still expected.' },
  { id:'full-required', label:'The full two-week commitment is required.' },
  { id:'something-else', label:'Something else...' },
];

export const MENTORING_PROMPT = 'Should I accept a two-week mentoring commitment for a student startup team?';

const mentoringPreparationLearning = (actualMinutes: number, estimatedMin = 30, estimatedMax = 45) => {
  if (actualMinutes > estimatedMax) {
    return 'Similar mentoring commitments have required more preparation than previously expected.';
  }
  if (actualMinutes < estimatedMin) {
    return 'This mentoring commitment required less preparation than the 30–45 minute estimate.';
  }
  return 'This mentoring commitment stayed within the estimated 30–45 minute preparation range.';
};

function activeDecision(): ActiveDecision {
  return {
    id:'decision.mentoring', prompt:MENTORING_PROMPT, priority:'high', stage:'expected-outcome',
    clarifications:[
      { id:'expected-outcome', label:'Expected Outcome', question:'What matters most to you about this opportunity?', options:expectedOutcomeOptions },
      { id:'commitment-flexibility', label:'Commitment Flexibility', question:'How flexible is the mentoring commitment?', options:flexibilityOptions },
    ],
  };
}

export function selectMentoringAlternatives(world: DemoWorld): Alternative[] {
  const expected = world.activeDecision?.clarifications.find(c => c.id === 'expected-outcome')?.answer;
  const flexibility = world.activeDecision?.clarifications.find(c => c.id === 'commitment-flexibility')?.answer;
  const normalizedExpected = expected?.trim().toLowerCase() ?? '';
  const explicitlyRequiresOngoing = /full[ -]two[ -]weeks|throughout the full two weeks|ongoing involvement|need ongoing|continuous involvement|do not want (?:a )?(?:limited|focused|bounded)|don't want (?:a )?(?:limited|focused|bounded)|not (?:a )?(?:limited|focused|bounded) session/.test(normalizedExpected);
  const expressesBoundedOutcome = /(meaningful-limited|relationship|bounded|limited (?:involvement|contribution)|involvement is limited|focused session|single session|one high-impact session|supporting the team)/.test(normalizedExpected);
  const requiresFullInvolvement = explicitlyRequiresOngoing || !expressesBoundedOutcome;
  const normalizedFlexibility = flexibility?.trim().toLowerCase() ?? '';
  const adjustable = normalizedFlexibility === 'scope-and-schedule-adjustable'
    || normalizedFlexibility === 'the scope and schedule can be adjusted.'
    || normalizedFlexibility === 'schedule-adjustable'
    || normalizedFlexibility === 'the schedule can change, but meaningful involvement is still expected.';
  const focusedFits = !requiresFullInvolvement && adjustable;
  return [
    { id:'reject', title:'Reject', fit:focusedFits ? 'moderate' : 'strong', recommended:!focusedFits, benefits:['Protects current capacity and existing commitments'], tradeoffs:['Gives up a high-value opportunity aligned with long-term direction'] },
    { id:'full-two-weeks', title:'Full two-week mentoring', fit:'weak', recommended:false, benefits:['Maximizes involvement'], tradeoffs:['Sustained load conflicts with limited capacity, deadlines, and recovery'] },
    { id:'focused-session', title:'Focused Mentoring Session', fit:focusedFits ? 'strong' : 'conditional', recommended:focusedFits, benefits:['Meaningful contribution','Strong long-term alignment','Bounded load'], tradeoffs:['Less continuous involvement','Requires deliberate schedule adjustment'] },
  ];
}

export function buildMentoringPlanPreview(_world: DemoWorld, availability: PlanProposal['availability']): PlanProposal {
  return {
    id:'plan.focused-mentoring', status:'preview', availability,
    beforeEventIds:['event.teaching.2026-10-16','event.monthly-report.2026-10-16','event.weekly-planning.2026-10-16','event.spare-capacity.2026-10-13'],
    afterEventIds:['event.teaching-monthly-report.2026-10-16','event.weekly-planning.2026-10-13','event.mentoring-preparation.2026-10-16','event.focused-mentoring.2026-10-16'],
    operations:[
      { kind:'consolidate', title:'Teaching + Monthly Report — Consolidated Morning Block', from:'Friday 13:00–14:00', to:'Friday 08:00–11:00', reason:'Teaching remains the fixed anchor; the flexible, low-focus report is batched into compatible morning work.' },
      { kind:'relocate', title:'Weekly Planning', from:'Friday 15:00–16:00', to:'Tuesday 15:00–16:00', reason:'Flexible low-focus work moves to safe spare capacity without violating a deadline.' },
      { kind:'insert', title:'Mentoring Preparation', to:'Friday 13:00–13:30', reason:'A protected preparation buffer supports the mentoring session.' },
      { kind:'insert', title:'Focused Mentoring Session', to:'Friday 13:30–15:00', reason:'The bounded high-value opportunity uses the continuous afternoon block.' },
    ],
  };
}

const afterEvents: CalendarEvent[] = [
  { id:'event.teaching-monthly-report.2026-10-16', title:'Teaching + Monthly Report — Consolidated Morning Block', start:'2026-10-16T08:00', end:'2026-10-16T11:00', kind:'fixed', focus:'high', priority:'high', taskId:'task.monthly-report', note:'Teaching remains the fixed anchor; Monthly Report is consolidated into it.' },
  { id:'event.weekly-planning.2026-10-13', title:'Weekly Planning — moved from Friday', start:'2026-10-13T15:00', end:'2026-10-13T16:00', kind:'flexible', focus:'low', priority:'low', taskId:'task.weekly-planning' },
  { id:'event.mentoring-preparation.2026-10-16', title:'Mentoring Preparation', start:'2026-10-16T13:00', end:'2026-10-16T13:30', kind:'new', focus:'medium', priority:'high', taskId:'task.mentoring-preparation' },
  { id:'event.focused-mentoring.2026-10-16', title:'Focused Mentoring Session', start:'2026-10-16T13:30', end:'2026-10-16T15:00', kind:'new', focus:'high', priority:'high', taskId:'task.focused-mentoring' },
  { id:'event.buffer-recovery.2026-10-16', title:'Buffer / Recovery', start:'2026-10-16T15:00', end:'2026-10-16T16:00', kind:'protected', focus:'none', priority:'medium' },
  { id:'event.flexible-work.2026-10-16.after', title:'Flexible Work', start:'2026-10-16T16:00', end:'2026-10-16T17:00', kind:'flexible', focus:'medium', priority:'medium' },
];
const removedOnApply = new Set(['event.teaching.2026-10-16','event.monthly-report.2026-10-16','event.flexible-work.2026-10-16','event.weekly-planning.2026-10-16','event.buffer.2026-10-16','event.spare-capacity.2026-10-13']);

export function demoWorldReducer(world: DemoWorld, action: DemoWorldAction): DemoWorld {
  switch (action.type) {
    case 'start-mentoring-decision': return { ...world, activeDecision:activeDecision(), activePlan:undefined, opportunities:world.opportunities.map(o => o.id === 'opportunity.student-startup-mentoring' ? { ...o, status:'considering' } : o) };
    case 'answer-expected-outcome': return world.activeDecision ? { ...world, activeDecision:{ ...world.activeDecision, stage:'commitment-flexibility', clarifications:world.activeDecision.clarifications.map(c => c.id === 'expected-outcome' ? { ...c, answer:action.answer } : c) } } : world;
    case 'answer-commitment-flexibility': return world.activeDecision ? { ...world, activeDecision:{ ...world.activeDecision, stage:'recommendation', clarifications:world.activeDecision.clarifications.map(c => c.id === 'commitment-flexibility' ? { ...c, answer:action.answer } : c) } } : world;
    case 'use-mentoring-plan': return world.activeDecision?.stage === 'recommendation' ? { ...world, activeDecision:{ ...world.activeDecision, stage:'team-availability' } } : world;
    case 'set-team-availability': return world.activeDecision?.stage === 'team-availability' && (action.availability === 'flexible-best-fit' || action.availability === 'friday-afternoon') ? { ...world, activeDecision:{ ...world.activeDecision, stage:'plan-preview' }, activePlan:buildMentoringPlanPreview(world, action.availability) } : world;
    case 'apply-active-plan': {
      if (!world.activePlan || world.activePlan.status !== 'preview' || !world.activeDecision) return world;
      const retainedTasks = world.tasks
        .filter(t => t.id !== 'task.mentoring-preparation' && t.id !== 'task.focused-mentoring')
        .map(t => t.id === 'task.monthly-report' ? { ...t, status:'planned' as const, scheduledEventId:'event.teaching-monthly-report.2026-10-16' } : t.id === 'task.weekly-planning' ? { ...t, status:'planned' as const, scheduledEventId:'event.weekly-planning.2026-10-13' } : t);
      return { ...world, calendarEvents:[...world.calendarEvents.filter(e => !removedOnApply.has(e.id)), ...afterEvents].sort((a,b) => a.start.localeCompare(b.start)), tasks:[...retainedTasks, { id:'task.mentoring-preparation', title:'Mentoring Preparation', status:'planned', priority:'high', flexibility:'fixed', focus:'medium', scheduledEventId:'event.mentoring-preparation.2026-10-16' }, { id:'task.focused-mentoring', title:'Focused Mentoring Session', status:'planned', priority:'high', flexibility:'fixed', focus:'high', scheduledEventId:'event.focused-mentoring.2026-10-16' }], opportunities:world.opportunities.map(o => o.id === 'opportunity.student-startup-mentoring' ? { ...o, status:'planned' } : o), capacityProfile:{ ...world.capacityProfile, projection:'limited-restructured' }, decisions:[...world.decisions.filter(d => d.id !== 'decision.mentoring'), { id:'decision.mentoring', title:'Student Startup Mentoring', chosenOption:'Focused Mentoring Session', status:'planned', createdOn:'2026-10-05' }], activeDecision:{ ...world.activeDecision, stage:'applied' }, activePlan:{ ...world.activePlan, status:'applied' } };
    }
    case 'use-workshop-recording': return { ...world, opportunities:world.opportunities.map(o => o.id === 'opportunity.professional-workshop' ? { ...o, status:'declined-live' } : o), tasks:[...world.tasks, { id:'task.review-workshop-recording', title:'Review workshop recording', status:'pending', priority:'low', flexibility:'flexible', focus:'low' }], decisions:[...world.decisions, { id:'decision.professional-workshop', title:'Optional Professional Development Workshop', chosenOption:'Use recording instead', status:'declined-live', createdOn:'2026-10-08' }] };
    case 'toggle-scenario-b-insight': return { ...world, ui:{ ...world.ui, scenarioBInsightOpen:action.open } };
    case 'update-mental-wellbeing': return { ...world, capacityProfile:{ ...world.capacityProfile, mentalWellbeing:{ value:action.value, provenance:'user-reported' } } };
    case 'update-goal': return { ...world, goals:world.goals.map(g => g.id === action.goalId ? { ...g, title:action.title, provenance:'user-reported' } : g) };
    case 'override-opportunity-value': return { ...world, opportunities:world.opportunities.map(o => o.id === action.opportunityId ? { ...o, value:{ level:action.value, provenance:'user-reported', overridden:true } } : o) };
    case 'correct-historical-preference': return { ...world, historicalPreferences:world.historicalPreferences.map(p => p.id === action.preferenceId ? { ...p, text:action.text, provenance:'observed-history', corrected:true } : p) };
    case 'complete-mentoring-with-reflection': {
      if (world.activePlan?.status !== 'applied' || !world.activeDecision) return world;
      const learned = mentoringPreparationLearning(action.actualPreparationMinutes);
      return { ...world, tasks:world.tasks.map(t => t.id === 'task.mentoring-preparation' || t.id === 'task.focused-mentoring' ? { ...t, status:'complete' as const } : t), opportunities:world.opportunities.map(o => o.id === 'opportunity.student-startup-mentoring' ? { ...o, status:'completed' } : o), outcomes:[...world.outcomes.filter(o => o.id !== 'outcome.mentoring.2026-10-16'), { id:'outcome.mentoring.2026-10-16', decisionId:'decision.mentoring', status:'completed', estimatedPreparationMinutes:{ min:30,max:45 }, actualPreparationMinutes:action.actualPreparationMinutes }], learnedSignals:[...world.learnedSignals.filter(s => s.id !== 'learned-signal.mentoring-preparation-buffer'), { id:'learned-signal.mentoring-preparation-buffer', text:learned, provenance:'observed-history' }], decisions:world.decisions.map(d => d.id === 'decision.mentoring' ? { ...d, status:'completed', actualOutcome:'Focused mentoring completed', learned } : d), activeDecision:{ ...world.activeDecision, stage:'completed' } };
    }
    case 'correct-mentoring-preparation': {
      const learned = mentoringPreparationLearning(action.actualPreparationMinutes);
      return {
        ...world,
        outcomes:world.outcomes.map(o => o.id === 'outcome.mentoring.2026-10-16' ? { ...o, actualPreparationMinutes:action.actualPreparationMinutes } : o),
        decisions:world.decisions.map(d => d.id === 'decision.mentoring' ? { ...d, actualOutcome:`Focused mentoring completed; preparation corrected to ${action.actualPreparationMinutes} minutes`, learned } : d),
        learnedSignals:world.learnedSignals.map(s => s.id === 'learned-signal.mentoring-preparation-buffer' ? { ...s, text:learned } : s),
      };
    }
    case 'reset-demo-world': return createDemoWorldBaseline();
    default: return world;
  }
}

export function selectCapacitySummary(world: DemoWorld) {
  const restructured = world.capacityProfile.projection === 'limited-restructured';
  return { timeAvailable:'Fixed two-week view', workload:world.capacityProfile.workload, focusCapacity:restructured ? 'Friday capacity created through consolidation and relocation' : 'Strong selected-afternoon windows', mentalWellbeing:world.capacityProfile.mentalWellbeing, availableCapacity:restructured ? 'restructured' : 'limited', projection:world.capacityProfile.projection };
}
export function selectScenarioBReasoning(world: DemoWorld) {
  const workshop = world.opportunities.find(o => o.id === 'opportunity.professional-workshop');
  return { clarificationRequired:false, calendarConflict:false, timeAvailable:true, deadlinePressure:'high' as const, focusOpportunityCost:'high' as const, usableCapacity:'low' as const, focusRemainingMinutes:90, focusWindow:'16:00–18:00', mentalWellbeing:world.capacityProfile.mentalWellbeing.value, workshopValue:workshop?.value.level ?? 'unknown', recordingAvailable:workshop?.recordingAvailable === true, recommendation:'use-recording-instead' as const, recommendationText:'Skip the live workshop and review the recording later.' };
}
export function selectCurrentOpportunity(world: DemoWorld, id = 'opportunity.student-startup-mentoring') { return world.opportunities.find(o => o.id === id); }
export function selectHistoryAndLearnedSignal(world: DemoWorld) { return { decisions:world.decisions, outcomes:world.outcomes, learnedSignals:world.learnedSignals, historicalPreferences:world.historicalPreferences }; }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
const hasStrings = (value: Record<string, unknown>, fields: string[]) => fields.every(field => typeof value[field] === 'string');
const optionalString = (value: Record<string, unknown>, field: string) => value[field] === undefined || typeof value[field] === 'string';
const recordsMatch = (value: unknown, predicate: (item: Record<string, unknown>) => boolean) => Array.isArray(value) && value.every(item => isRecord(item) && predicate(item));
const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T => typeof value === 'string' && allowed.includes(value as T);
const provenanceValues = ['user-reported','imported-source-data','observed-history','inferred','derived'] as const;
const priorityValues = ['high','medium','low'] as const;
const demoDatePattern = /^2026-10-(0[5-9]|1[0-8])$/;
const demoDateTimePattern = /^2026-10-(0[5-9]|1[0-8])T([01]\d|2[0-3]):[0-5]\d$/;
const isDemoDate = (value: unknown) => typeof value === 'string' && demoDatePattern.test(value);
const isDemoDateTime = (value: unknown) => typeof value === 'string' && demoDateTimePattern.test(value) && !Number.isNaN(Date.parse(`${value}:00Z`));

const isCalendarEvent = (item: Record<string, unknown>) => hasStrings(item, ['id','title']) && isDemoDateTime(item.start) && isDemoDateTime(item.end) && String(item.start) < String(item.end) && isOneOf(item.kind, ['fixed','flexible','protected','deadline','free','new','consolidated']) && isOneOf(item.focus, ['high','medium','low','none']) && isOneOf(item.priority, priorityValues) && optionalString(item, 'taskId') && optionalString(item, 'note');
const isTask = (item: Record<string, unknown>) => hasStrings(item, ['id','title']) && isOneOf(item.status, ['pending','planned','complete']) && isOneOf(item.priority, priorityValues) && isOneOf(item.flexibility, ['fixed','flexible','protected']) && isOneOf(item.focus, ['high','medium','low']) && optionalString(item, 'scheduledEventId') && optionalString(item, 'deadlineEventId');
const isGoal = (item: Record<string, unknown>) => hasStrings(item, ['id','title']) && isOneOf(item.horizon, ['short-term','long-term']) && isOneOf(item.priority, ['high','medium']) && isOneOf(item.provenance, provenanceValues) && item.editable === true;
const isPreference = (item: Record<string, unknown>) => hasStrings(item, ['id','text']) && isOneOf(item.provenance, ['inferred','observed-history']) && (item.corrected === undefined || typeof item.corrected === 'boolean');
const isOpportunity = (item: Record<string, unknown>) => hasStrings(item, ['id','title','requiredCommitment']) && isOneOf(item.status, ['available','considering','planned','completed','declined-live']) && isOneOf(item.priority, ['high','medium']) && isRecord(item.value) && isOneOf(item.value.level, ['high','moderate','low']) && isOneOf(item.value.provenance, provenanceValues) && (item.value.overridden === undefined || typeof item.value.overridden === 'boolean') && optionalString(item, 'decisionId') && optionalString(item, 'scheduledEventId') && (item.recordingAvailable === undefined || typeof item.recordingAvailable === 'boolean') && (item.optional === undefined || typeof item.optional === 'boolean');
const isDecision = (item: Record<string, unknown>) => hasStrings(item, ['id','title','chosenOption']) && isOneOf(item.status, ['planned','completed','declined-live']) && isDemoDate(item.createdOn) && optionalString(item, 'actualOutcome') && optionalString(item, 'learned');
const isOutcome = (item: Record<string, unknown>) => hasStrings(item, ['id','decisionId']) && item.status === 'completed' && isRecord(item.estimatedPreparationMinutes) && typeof item.estimatedPreparationMinutes.min === 'number' && typeof item.estimatedPreparationMinutes.max === 'number' && typeof item.actualPreparationMinutes === 'number';
const isLearnedSignal = (item: Record<string, unknown>) => hasStrings(item, ['id','text']) && item.provenance === 'observed-history';
const isClarification = (item: Record<string, unknown>) => isOneOf(item.id, ['expected-outcome','commitment-flexibility']) && hasStrings(item, ['label','question']) && recordsMatch(item.options, option => hasStrings(option, ['id','label'])) && optionalString(item, 'answer');
const isActiveDecision = (item: Record<string, unknown>) => item.id === 'decision.mentoring' && typeof item.prompt === 'string' && item.priority === 'high' && isOneOf(item.stage, ['expected-outcome','commitment-flexibility','recommendation','team-availability','plan-preview','applied','completed']) && recordsMatch(item.clarifications, isClarification);
const isPlanOperation = (item: Record<string, unknown>) => isOneOf(item.kind, ['consolidate','relocate','insert']) && hasStrings(item, ['title','to','reason']) && optionalString(item, 'from');
const isActivePlan = (item: Record<string, unknown>) => item.id === 'plan.focused-mentoring' && isOneOf(item.status, ['preview','applied']) && isOneOf(item.availability, ['thursday-afternoon','friday-afternoon','flexible-best-fit','another-time']) && isStringArray(item.beforeEventIds) && isStringArray(item.afterEventIds) && recordsMatch(item.operations, isPlanOperation);

function isDemoWorld(value: unknown): value is DemoWorld {
  if (!isRecord(value) || value.demoVersion !== DEMO_WORLD_VERSION) return false;
  if (!isRecord(value.persona) || value.persona.id !== 'persona-a' || value.persona.label !== 'Persona A' || !isStringArray(value.persona.roles)) return false;
  if (!isRecord(value.period) || value.period.start !== '2026-10-05' || value.period.end !== '2026-10-18') return false;
  if (!recordsMatch(value.calendarEvents, isCalendarEvent) || !recordsMatch(value.tasks, isTask) || !recordsMatch(value.goals, isGoal)) return false;
  if (!isStringArray(value.priorities) || !recordsMatch(value.historicalPreferences, isPreference) || !recordsMatch(value.opportunities, isOpportunity)) return false;
  if (!recordsMatch(value.decisions, isDecision) || !recordsMatch(value.outcomes, isOutcome) || !recordsMatch(value.learnedSignals, isLearnedSignal)) return false;
  const hasId = (records: unknown, id: string) => Array.isArray(records) && records.some(item => isRecord(item) && item.id === id);
  if (!hasId(value.calendarEvents, 'event.client-proposal-deadline.2026-10-08') || !hasId(value.calendarEvents, 'event.free-window.2026-10-08')) return false;
  if (!hasId(value.tasks, 'deadline.client-proposal') || !hasId(value.tasks, 'task.monthly-report') || !hasId(value.tasks, 'task.weekly-planning')) return false;
  if (!hasId(value.goals, 'goal.short.teaching') || !hasId(value.goals, 'goal.long.venture') || !hasId(value.goals, 'goal.long.mentoring')) return false;
  if (!hasId(value.opportunities, 'opportunity.student-startup-mentoring') || !hasId(value.opportunities, 'opportunity.professional-workshop')) return false;
  if (!hasId(value.historicalPreferences, 'preference.bounded-advisory')) return false;
  if (!isRecord(value.capacityProfile) || value.capacityProfile.workload !== 'high' || !isStringArray(value.capacityProfile.focusWindows) || value.capacityProfile.weekendProtected !== true || !isOneOf(value.capacityProfile.projection, ['limited','limited-restructured'])) return false;
  if (!isRecord(value.capacityProfile.mentalWellbeing) || !isOneOf(value.capacityProfile.mentalWellbeing.value, ['slightly-strained','steady']) || value.capacityProfile.mentalWellbeing.provenance !== 'user-reported') return false;
  if (!isRecord(value.ui) || typeof value.ui.scenarioBInsightOpen !== 'boolean') return false;
  if (value.activeDecision !== undefined && (!isRecord(value.activeDecision) || !isActiveDecision(value.activeDecision))) return false;
  if (value.activePlan !== undefined && (!isRecord(value.activePlan) || !isActivePlan(value.activePlan))) return false;
  return true;
}

export function hydrateDemoWorld(storage: StorageAdapter): DemoWorld {
  try { const raw = storage.getItem(DEMO_WORLD_STORAGE_KEY); if (!raw) return createDemoWorldBaseline(); const parsed: unknown = JSON.parse(raw); return isDemoWorld(parsed) ? parsed : createDemoWorldBaseline(); } catch { storage.removeItem(DEMO_WORLD_STORAGE_KEY); return createDemoWorldBaseline(); }
}
export function persistDemoWorld(world: DemoWorld, storage: StorageAdapter) { storage.setItem(DEMO_WORLD_STORAGE_KEY, JSON.stringify(world)); }
