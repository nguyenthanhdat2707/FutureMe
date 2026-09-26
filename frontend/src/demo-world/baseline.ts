import type { CalendarEvent, DemoTask, DemoWorld, Goal, Opportunity } from './types';

export const DEMO_WORLD_VERSION = 'pitch-final-v1';
export const DEMO_WORLD_STORAGE_KEY = 'future-me:pitch-demo-world:v1';

const event = (id: string, title: string, start: string, end: string, kind: CalendarEvent['kind'], focus: CalendarEvent['focus'], priority: CalendarEvent['priority'], taskId?: string, note?: string): CalendarEvent => ({ id, title, start, end, kind, focus, priority, taskId, note });

const calendarEvents: CalendarEvent[] = [
  event('event.teaching.2026-10-05','Teaching','2026-10-05T09:00','2026-10-05T11:00','fixed','high','high'),
  event('event.operations-review.2026-10-05','Operations Review','2026-10-05T13:30','2026-10-05T15:00','fixed','medium','high'),
  event('event.product-planning.2026-10-05','Product Planning','2026-10-05T15:30','2026-10-05T17:00','flexible','medium','medium'),
  event('event.team-sync.2026-10-06','Team Sync','2026-10-06T09:00','2026-10-06T10:30','fixed','medium','high'),
  event('event.proposal-deep-work.2026-10-06','Proposal Deep Work','2026-10-06T14:00','2026-10-06T16:00','flexible','high','high','deadline.client-proposal'),
  event('event.partner-meeting.2026-10-07','Partner Meeting','2026-10-07T10:00','2026-10-07T12:00','fixed','high','high'),
  event('event.research-admin.2026-10-07','Research / Admin','2026-10-07T14:00','2026-10-07T15:30','flexible','low','medium'),
  event('event.business-meeting.2026-10-08','Business Meeting','2026-10-08T09:00','2026-10-08T10:30','fixed','high','high'),
  event('event.project-review.2026-10-08','Project Review','2026-10-08T13:00','2026-10-08T14:30','fixed','medium','high'),
  event('event.lighter-work.2026-10-08','Lighter Work / Transition','2026-10-08T14:30','2026-10-08T16:00','flexible','low','medium'),
  event('event.free-window.2026-10-08','FREE','2026-10-08T16:00','2026-10-08T17:00','free','none','low',undefined,'Calendar availability only; usable capacity is low.'),
  event('event.client-proposal-deadline.2026-10-08','Client Proposal Deadline','2026-10-08T19:00','2026-10-08T19:15','deadline','high','high','deadline.client-proposal'),
  event('event.business-review.2026-10-09','Business Review','2026-10-09T09:00','2026-10-09T11:00','fixed','high','high'),
  event('event.stakeholder-meeting.2026-10-09','Stakeholder Meeting','2026-10-09T14:00','2026-10-09T15:30','fixed','high','high'),
  event('event.admin-review.2026-10-09','Admin / Review','2026-10-09T15:30','2026-10-09T17:00','flexible','low','low'),
  event('event.recovery.2026-10-10','Protected recovery','2026-10-10T09:00','2026-10-10T18:00','protected','none','high'),
  event('event.recovery.2026-10-11','Protected recovery','2026-10-11T09:00','2026-10-11T18:00','protected','none','high'),
  event('event.teaching.2026-10-12','Teaching','2026-10-12T09:00','2026-10-12T11:00','fixed','high','high'),
  event('event.product-planning.2026-10-12','Product Planning','2026-10-12T14:00','2026-10-12T16:00','flexible','medium','medium'),
  event('event.partner-meeting.2026-10-13','Partner Meeting','2026-10-13T10:00','2026-10-13T12:00','fixed','high','high'),
  event('event.teaching-preparation.2026-10-13','Teaching Preparation','2026-10-13T14:00','2026-10-13T15:00','flexible','low','medium'),
  event('event.spare-capacity.2026-10-13','Low-focus spare capacity','2026-10-13T15:00','2026-10-13T16:00','free','low','low'),
  event('event.business-operations.2026-10-14','Business Operations','2026-10-14T09:00','2026-10-14T11:00','fixed','high','high'),
  event('event.admin-review.2026-10-14','Admin / Review','2026-10-14T13:30','2026-10-14T15:00','flexible','low','low'),
  event('event.external-meeting.2026-10-15','External Meeting','2026-10-15T09:00','2026-10-15T10:30','fixed','high','high'),
  event('event.project-review.2026-10-15','Project Review','2026-10-15T13:00','2026-10-15T14:30','fixed','medium','high'),
  event('event.business-follow-up.2026-10-15','Flexible Business Follow-up','2026-10-15T15:00','2026-10-15T16:00','flexible','low','medium'),
  event('event.teaching.2026-10-16','Teaching','2026-10-16T08:00','2026-10-16T11:00','fixed','high','high'),
  event('event.lunch-recovery.2026-10-16','Lunch / Recovery','2026-10-16T11:00','2026-10-16T13:00','protected','none','high'),
  event('event.monthly-report.2026-10-16','Monthly Report','2026-10-16T13:00','2026-10-16T14:00','flexible','low','low','task.monthly-report'),
  event('event.flexible-work.2026-10-16','Flexible Work','2026-10-16T14:00','2026-10-16T15:00','flexible','medium','medium'),
  event('event.weekly-planning.2026-10-16','Weekly Planning','2026-10-16T15:00','2026-10-16T16:00','flexible','low','low','task.weekly-planning'),
  event('event.buffer.2026-10-16','Buffer / Flexible Capacity','2026-10-16T16:00','2026-10-16T17:00','flexible','low','low'),
  event('event.recovery.2026-10-17','Protected recovery','2026-10-17T09:00','2026-10-17T18:00','protected','none','high'),
  event('event.recovery.2026-10-18','Protected recovery','2026-10-18T09:00','2026-10-18T18:00','protected','none','high'),
];

const tasks: DemoTask[] = [
  { id:'deadline.client-proposal', title:'Complete Client Proposal', status:'pending', priority:'high', flexibility:'fixed', focus:'high', deadlineEventId:'event.client-proposal-deadline.2026-10-08' },
  { id:'task.monthly-report', title:'Monthly Report', status:'pending', priority:'low', flexibility:'flexible', focus:'low', scheduledEventId:'event.monthly-report.2026-10-16' },
  { id:'task.weekly-planning', title:'Weekly Planning', status:'pending', priority:'low', flexibility:'flexible', focus:'low', scheduledEventId:'event.weekly-planning.2026-10-16' },
];

const goals: Goal[] = [
  { id:'goal.short.teaching', horizon:'short-term', title:'Deliver current teaching responsibilities', priority:'high', provenance:'user-reported', editable:true },
  { id:'goal.short.deadlines', horizon:'short-term', title:'Protect important business and project deadlines', priority:'high', provenance:'user-reported', editable:true },
  { id:'goal.short.sustainable', horizon:'short-term', title:'Maintain enough recovery capacity', priority:'high', provenance:'user-reported', editable:true },
  { id:'goal.long.venture', horizon:'long-term', title:'Grow a sustainable technology venture', priority:'high', provenance:'user-reported', editable:true },
  { id:'goal.long.ecosystem', horizon:'long-term', title:'Increase involvement in the startup ecosystem', priority:'medium', provenance:'user-reported', editable:true },
  { id:'goal.long.mentoring', horizon:'long-term', title:'Contribute through mentoring and advisory work', priority:'high', provenance:'user-reported', editable:true },
  { id:'goal.long.balance', horizon:'long-term', title:'Balance professional ambition with personal capacity', priority:'high', provenance:'user-reported', editable:true },
];

const opportunities: Opportunity[] = [
  { id:'opportunity.student-startup-mentoring', title:'Student Startup Mentoring', status:'available', priority:'high', value:{ level:'high', provenance:'inferred' }, requiredCommitment:'Sustained involvement across two weeks', decisionId:'decision.mentoring' },
  { id:'opportunity.professional-workshop', title:'Optional Professional Development Workshop', status:'available', priority:'medium', value:{ level:'moderate', provenance:'inferred' }, requiredCommitment:'Thursday Oct 8, 16:00–17:00 live attendance', scheduledEventId:'event.free-window.2026-10-08', recordingAvailable:true, optional:true },
];

export function createDemoWorldBaseline(): DemoWorld {
  return structuredClone({
    demoVersion: DEMO_WORLD_VERSION,
    persona:{ id:'persona-a', label:'Persona A', roles:['University lecturer','Business / entrepreneurial lead','Project and stakeholder lead','Mentor / advisor'] },
    period:{ start:'2026-10-05', end:'2026-10-18' },
    calendarEvents,
    tasks,
    goals,
    priorities:['Protect hard deadlines','Deliver teaching responsibilities','Pursue high-value bounded opportunities','Protect recovery'],
    capacityProfile:{ workload:'high', mentalWellbeing:{ value:'slightly-strained', provenance:'user-reported' }, focusWindows:['Selected afternoons','Thursday 16:00–18:00'], weekendProtected:true, projection:'limited' },
    historicalPreferences:[{ id:'preference.bounded-advisory', text:'Clearly scoped, bounded advisory commitments tend to fit better than open-ended recurring commitments.', provenance:'inferred' }],
    opportunities,
    decisions:[], outcomes:[], learnedSignals:[],
    ui:{ scenarioBInsightOpen:false },
  } satisfies DemoWorld);
}
