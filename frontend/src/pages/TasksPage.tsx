import { useDemoWorld, type CalendarEvent, type DemoTask } from '../demo-world';

const DAY_LABELS: Record<string, string> = {
  '2026-10-05': 'Monday Oct 5',
  '2026-10-06': 'Tuesday Oct 6',
  '2026-10-07': 'Wednesday Oct 7',
  '2026-10-08': 'Thursday Oct 8',
  '2026-10-09': 'Friday Oct 9',
  '2026-10-10': 'Saturday Oct 10',
  '2026-10-11': 'Sunday Oct 11',
  '2026-10-12': 'Monday Oct 12',
  '2026-10-13': 'Tuesday Oct 13',
  '2026-10-14': 'Wednesday Oct 14',
  '2026-10-15': 'Thursday Oct 15',
  '2026-10-16': 'Friday Oct 16',
  '2026-10-17': 'Saturday Oct 17',
  '2026-10-18': 'Sunday Oct 18',
};

function formatDay(dateStr: string): string {
  if (DAY_LABELS[dateStr]) return DAY_LABELS[dateStr];
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()];
  const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1];
  return `${weekday} ${monthName} ${day}`;
}

function getTaskScheduleLabel(task: DemoTask, calendarEvents: CalendarEvent[]): string {
  const eventId = task.scheduledEventId ?? task.deadlineEventId;
  if (!eventId) return 'Flexible backlog';

  const ev = calendarEvents.find((e) => e.id === eventId);
  if (!ev) return 'Scheduled';

  const dateStr = ev.start.slice(0, 10);
  const dayStr = formatDay(dateStr);
  const startTime = ev.start.slice(11, 16);
  const endTime = ev.end ? ev.end.slice(11, 16) : '';
  const timeStr = ev.kind === 'deadline' ? `Deadline ${startTime}` : `${startTime}–${endTime}`;

  if (ev.title.includes('Consolidated')) {
    return `${dayStr} · ${timeStr} · ${ev.title}`;
  }

  return `${dayStr} · ${timeStr}`;
}

export function TasksPage() {
  const { world } = useDemoWorld();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Shared plan</p>
        <h1 className="mt-2 text-4xl text-text-primary">Tasks & deadlines</h1>
        <p className="mt-2 text-text-secondary">Schedule references come from the same entities shown on Calendar.</p>
      </header>
      <section className="mt-7 grid gap-4">
        {world.tasks.map((t) => (
          <article key={t.id} className="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold capitalize">
                  {t.priority} priority
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold capitalize text-amber-800">
                  {t.flexibility}
                </span>
                <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold capitalize text-violet-800">
                  {t.focus} focus
                </span>
              </div>
              <h2 className="mt-3 text-xl text-text-primary">{t.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {getTaskScheduleLabel(t, world.calendarEvents)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                t.status === 'complete'
                  ? 'bg-emerald-100 text-emerald-800'
                  : t.status === 'planned'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {t.status}
            </span>
          </article>
        ))}
      </section>
    </main>
  );
}

export default TasksPage;
