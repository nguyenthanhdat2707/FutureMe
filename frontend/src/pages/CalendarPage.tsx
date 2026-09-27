import { useDemoWorld } from '../demo-world';

const DAY_LABELS: Record<string,string> = {'2026-10-05':'Mon Oct 5','2026-10-06':'Tue Oct 6','2026-10-07':'Wed Oct 7','2026-10-08':'Thu Oct 8','2026-10-09':'Fri Oct 9','2026-10-10':'Sat Oct 10','2026-10-11':'Sun Oct 11','2026-10-12':'Mon Oct 12','2026-10-13':'Tue Oct 13','2026-10-14':'Wed Oct 14','2026-10-15':'Thu Oct 15','2026-10-16':'Fri Oct 16','2026-10-17':'Sat Oct 17','2026-10-18':'Sun Oct 18'};
const KINDS = ['fixed','flexible','protected','deadline','free','new','consolidated'] as const;
const style: Record<string,string> = {fixed:'border-blue-200 bg-blue-50',flexible:'border-amber-200 bg-amber-50',protected:'border-emerald-200 bg-emerald-50',deadline:'border-red-300 bg-red-50',free:'border-dashed border-slate-300 bg-white',new:'border-violet-300 bg-violet-50',consolidated:'border-indigo-300 bg-indigo-50'};
const time = (iso:string) => iso.slice(11,16);

export function CalendarPage(){
  const { world } = useDemoWorld();
  return <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10"><header><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Oct 5–18, 2026 · Persona A</p><h1 className="mt-2 text-4xl text-text-primary">Two-week calendar</h1><p className="mt-2 text-text-secondary">Fixed anchors stay protected. Flexible work changes only after you apply a plan.</p></header>
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Calendar legend">{KINDS.map(k=><span key={k} className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${style[k]}`}>{k}</span>)}</div>
    <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{Object.entries(DAY_LABELS).map(([date,label])=>{const events=world.calendarEvents.filter(e=>e.start.startsWith(date));return <article key={date} className="card min-h-52 p-4"><h2 className="text-lg text-text-primary">{label}</h2><div className="mt-3 space-y-2">{events.map(e=><div key={e.id} className={`rounded-xl border p-3 ${style[e.kind]}`}><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-text-primary">{e.title}</p><span className="text-[10px] font-bold uppercase text-text-secondary">{e.id==='event.teaching-monthly-report.2026-10-16'?'Fixed anchor · consolidated':e.kind}</span></div><p className="mt-1 text-xs font-mono text-text-secondary">{e.kind==='deadline' ? time(e.start) : `${time(e.start)}–${time(e.end)}`}</p>{e.note&&<p className="mt-1 text-xs text-text-secondary">{e.note}</p>}</div>)}</div></article>})}</section>
  </main>;
}
export default CalendarPage;
