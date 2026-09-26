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

function activeDecision(): ActiveDecision {
  return {
    id:'decision.mentoring', prompt:MENTORING_PROMPT, priority:'high', stage:'expected-outcome',
    clarifications:[
      { id:'expected-outcome', label:'Expected Outcome', question:'What matters most to you about this opportunity?', options:expectedOutcomeOptions },
      { id:'commitment-flexibility', label:'Commitment Flexibility', question:'How flexible is the mentoring commitment?', options:flexibilityOptions },
    ],
  };
}

export function selectMentoringAlternatives(_world: DemoWorld): Alternative[] {
  return [
    { id:'reject', title:'Reject', fit:'moderate', recommended:false, benefits:['Protects current capacity and existing commitments'], tradeoffs:['Gives up a high-value opportunity aligned with long-term direction'] },
    { id:'full-two-weeks', title:'Full two-week mentoring', fit:'weak', recommended:false, benefits:['Maximizes involvement'], tradeoffs:['Sustained load conflicts with limited capacity, deadlines, and recovery'] },
    { id:'focused-session', title:'Focused Mentoring Session', fit:'strong', recommended:true, benefits:['Meaningful contribution','Strong long-term alignment','Bounded load'], tradeoffs:['Less continuous involvement','Requires deliberate schedule adjustment'] },
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
  { id:'event.teaching-monthly-report.2026-10-16', title:'Teaching + Monthly Report — Consolidated Morning Block', start:'2026-10-16T08:00', end:'2026-10-16T11:00', kind:'consolidated', focus:'high', priority:'high', taskId:'task.monthly-report', note:'Teaching remains the fixed anchor.' },
  { id:'event.weekly-planning.2026-10-13', title:'Weekly Planning — moved from Friday', start:'2026-10-13T15:00', end:'2026-10-13T16:00', kind:'flexible', focus:'low', priority:'low', taskId:'task.weekly-planning' },
  { id:'event.mentoring-preparation.2026-10-16', title:'Mentoring Preparation', start:'2026-10-16T13:00', end:'2026-10-16T13:30', kind:'new', focus:'medium', priority:'high' },
  { id:'event.focused-mentoring.2026-10-16', title:'Focused Mentoring Session', start:'2026-10-16T13:30', end:'2026-10-16T15:00', kind:'new', focus:'high', priority:'high' },
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
    case 'set-team-availability': return world.activeDecision?.stage === 'team-availability' ? { ...world, activeDecision:{ ...world.activeDecision, stage:'plan-preview' }, activePlan:buildMentoringPlanPreview(world, action.availability) } : world;
    case 'apply-active-plan': {
      if (!world.activePlan || world.activePlan.status !== 'preview' || !world.activeDecision) return world;
      return { ...world, calendarEvents:[...world.calendarEvents.filter(e => !removedOnApply.has(e.id)), ...afterEvents].sort((a,b) => a.start.localeCompare(b.start)), tasks:world.tasks.map(t => t.id === 'task.monthly-report' ? { ...t, status:'planned', scheduledEventId:'event.teaching-monthly-report.2026-10-16' } : t.id === 'task.weekly-planning' ? { ...t, status:'planned', scheduledEventId:'event.weekly-planning.2026-10-13' } : t), opportunities:world.opportunities.map(o => o.id === 'opportunity.student-startup-mentoring' ? { ...o, status:'planned' } : o), capacityProfile:{ ...world.capacityProfile, projection:'limited-restructured' }, decisions:[...world.decisions.filter(d => d.id !== 'decision.mentoring'), { id:'decision.mentoring', title:'Student Startup Mentoring', chosenOption:'Focused Mentoring Session', status:'planned', createdOn:'2026-10-05' }], activeDecision:{ ...world.activeDecision, stage:'applied' }, activePlan:{ ...world.activePlan, status:'applied' } };
    }
    case 'use-workshop-recording': return { ...world, opportunities:world.opportunities.map(o => o.id === 'opportunity.professional-workshop' ? { ...o, status:'declined-live' } : o), tasks:[...world.tasks, { id:'task.review-workshop-recording', title:'Review workshop recording', status:'pending', priority:'low', flexibility:'flexible', focus:'low' }], decisions:[...world.decisions, { id:'decision.professional-workshop', title:'Optional Professional Development Workshop', chosenOption:'Use recording instead', status:'declined-live', createdOn:'2026-10-08' }] };
    case 'toggle-scenario-b-insight': return { ...world, ui:{ ...world.ui, scenarioBInsightOpen:action.open } };
    case 'update-mental-wellbeing': return { ...world, capacityProfile:{ ...world.capacityProfile, mentalWellbeing:{ value:action.value, provenance:'user-reported' } } };
    case 'update-goal': return { ...world, goals:world.goals.map(g => g.id === action.goalId ? { ...g, title:action.title, provenance:'user-reported' } : g) };
    case 'override-opportunity-value': return { ...world, opportunities:world.opportunities.map(o => o.id === action.opportunityId ? { ...o, value:{ level:action.value, provenance:'user-reported', overridden:true } } : o) };
    case 'correct-historical-preference': return { ...world, historicalPreferences:world.historicalPreferences.map(p => p.id === action.preferenceId ? { ...p, text:action.text, provenance:'observed-history', corrected:true } : p) };
    case 'complete-mentoring-with-reflection': {
      if (world.activePlan?.status !== 'applied' || !world.activeDecision) return world;
      const learned = 'Similar mentoring commitments have required more preparation than previously expected.';
      return { ...world, tasks:world.tasks.map(t => t.id === 'task.monthly-report' || t.id === 'task.weekly-planning' ? t : t), opportunities:world.opportunities.map(o => o.id === 'opportunity.student-startup-mentoring' ? { ...o, status:'completed' } : o), outcomes:[...world.outcomes.filter(o => o.id !== 'outcome.mentoring.2026-10-16'), { id:'outcome.mentoring.2026-10-16', decisionId:'decision.mentoring', status:'completed', estimatedPreparationMinutes:{ min:30,max:45 }, actualPreparationMinutes:action.actualPreparationMinutes }], learnedSignals:[...world.learnedSignals.filter(s => s.id !== 'learned-signal.mentoring-preparation-buffer'), { id:'learned-signal.mentoring-preparation-buffer', text:learned, provenance:'observed-history' }], decisions:world.decisions.map(d => d.id === 'decision.mentoring' ? { ...d, status:'completed', actualOutcome:'Focused mentoring completed', learned } : d), activeDecision:{ ...world.activeDecision, stage:'completed' } };
    }
    case 'reset-demo-world': return createDemoWorldBaseline();
    default: return world;
  }
}

export function selectCapacitySummary(world: DemoWorld) {
  return { timeAvailable:'Fixed two-week view', workload:world.capacityProfile.workload, focusCapacity:'Strong selected-afternoon windows', mentalWellbeing:world.capacityProfile.mentalWellbeing, availableCapacity:'limited' as const, projection:world.capacityProfile.projection };
}
export function selectScenarioBReasoning(_world: DemoWorld) {
  return { clarificationRequired:false, calendarConflict:false, timeAvailable:true, deadlinePressure:'high' as const, focusOpportunityCost:'high' as const, usableCapacity:'low' as const, focusRemainingMinutes:90, focusWindow:'16:00–18:00', recommendation:'use-recording-instead' as const, recommendationText:'Skip the live workshop and review the recording later.' };
}
export function selectCurrentOpportunity(world: DemoWorld, id = 'opportunity.student-startup-mentoring') { return world.opportunities.find(o => o.id === id); }
export function selectHistoryAndLearnedSignal(world: DemoWorld) { return { decisions:world.decisions, outcomes:world.outcomes, learnedSignals:world.learnedSignals, historicalPreferences:world.historicalPreferences }; }
export function hydrateDemoWorld(storage: StorageAdapter): DemoWorld {
  try { const raw = storage.getItem(DEMO_WORLD_STORAGE_KEY); if (!raw) return createDemoWorldBaseline(); const parsed = JSON.parse(raw) as DemoWorld; return parsed?.demoVersion === DEMO_WORLD_VERSION && Array.isArray(parsed.calendarEvents) && Array.isArray(parsed.tasks) ? parsed : createDemoWorldBaseline(); } catch { storage.removeItem(DEMO_WORLD_STORAGE_KEY); return createDemoWorldBaseline(); }
}
export function persistDemoWorld(world: DemoWorld, storage: StorageAdapter) { storage.setItem(DEMO_WORLD_STORAGE_KEY, JSON.stringify(world)); }
