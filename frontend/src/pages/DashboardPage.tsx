import { Link } from 'react-router-dom';
import { selectCapacitySummary, selectScenarioBReasoning, useDemoWorld } from '../demo-world';

const DAYS = [
  ['Mon Oct 5','Busy'],['Tue Oct 6','Focused'],['Wed Oct 7','Busy'],['Thu Oct 8','Deadline'],['Fri Oct 9','Busy'],['Sat Oct 10','Protected'],['Sun Oct 11','Protected'],
  ['Mon Oct 12','Busy'],['Tue Oct 13','Capacity'],['Wed Oct 14','Busy'],['Thu Oct 15','Busy'],['Fri Oct 16','Restructurable'],['Sat Oct 17','Protected'],['Sun Oct 18','Protected'],
] as const;

function tone(label: string) {
  if (label === 'Protected') return 'bg-emerald-100 text-emerald-800';
  if (label === 'Deadline') return 'bg-red-100 text-red-800';
  if (label === 'Capacity' || label === 'Restructurable') return 'bg-violet-100 text-violet-800';
  if (label === 'Focused') return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

export function DashboardPage() {
  const { world, dispatch } = useDemoWorld();
  const capacity = selectCapacitySummary(world);
  const capacityDays = DAYS.map(([day,label]) => [day, world.activePlan?.status === 'applied' && day === 'Tue Oct 13' ? 'Relocated work' : world.activePlan?.status === 'applied' && day === 'Fri Oct 16' ? 'Focused plan' : label] as const);
  const reasoning = selectScenarioBReasoning(world);
  const workshop = world.opportunities.find((item) => item.id === 'opportunity.professional-workshop');
  const mentoring = world.opportunities.find((item) => item.id === 'opportunity.student-startup-mentoring');
  const upcoming = world.calendarEvents.filter((event) => event.kind === 'deadline' || event.kind === 'fixed').slice(0, 6);

  const openReasoning = () => {
    dispatch({ type:'toggle-scenario-b-insight', open:true });
  };

  return (
    <main className="mx-auto max-w-[1440px] space-y-7 px-5 py-8 lg:px-10 lg:py-10">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Persona A · Oct 5–18, 2026</p>
          <h1 className="mt-2 text-4xl font-semibold text-text-primary">Your next two weeks, understood.</h1>
          <p className="mt-2 max-w-2xl text-text-secondary">Future Me connects calendar facts, usable capacity, personal direction, and history—not just empty slots.</p>
        </div>
        <Link to="/understanding" className="rounded-xl border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-primary">View what Future Me understands</Link>
      </header>

      <section className="grid gap-4 md:grid-cols-4" aria-label="Current state">
        {[
          ['Workload','High workload','Several fixed commitments and a hard deadline'],
          ['Available Capacity',capacity.availableCapacity === 'limited' ? 'Limited' : 'Restructured','Usable capacity, not empty time'],
          ['Mental Well-being',world.capacityProfile.mentalWellbeing.value === 'slightly-strained' ? 'Slightly strained' : 'Steady','User Reported'],
          ['Next critical deadline','Client Proposal · Thu Oct 8, 19:00','~90 minutes focused work remains'],
        ].map(([label,value,note]) => <article key={label} className="card p-5"><p className="text-xs font-bold uppercase tracking-wide text-text-secondary">{label}</p><p className="mt-2 text-xl font-semibold text-text-primary">{value}</p><p className="mt-1 text-xs text-text-secondary">{note}</p></article>)}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-end justify-between border-b border-surface-border p-6"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Fixed demo period</p><h2 className="mt-1 text-2xl text-text-primary">14-Day Capacity</h2></div><p className="text-sm text-text-secondary">Busy ≠ impossible · Free ≠ available</p></div>
        <div className="grid grid-cols-2 gap-px bg-surface-border sm:grid-cols-4 lg:grid-cols-7">
          {capacityDays.map(([day,label]) => <div key={day} className="min-h-28 bg-white p-3"><p className="text-sm font-semibold text-text-primary">{day}</p><span className={`mt-4 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${tone(label)}`}>{label}</span><div className="mt-3 h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${label === 'Protected' ? 'w-1/4 bg-emerald-400' : label === 'Capacity' ? 'w-2/5 bg-violet-400' : 'w-4/5 bg-amber-400'}`} /></div></div>)}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Proactive insight</p><h2 className="mt-2 max-w-3xl text-2xl text-text-primary">4:00 PM looks free, but using it for the workshop would put your 7:00 PM deadline under unnecessary pressure.</h2></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">No calendar conflict</span></div>
          <p className="mt-3 text-sm font-bold text-emerald-800">Thursday Oct 8 · 16:00–17:00 · FREE</p>
          <p className="mt-1 text-sm text-text-secondary">The optional workshop consumes the strongest remaining focus window before the Client Proposal deadline.</p>
          <button type="button" onClick={openReasoning} className="mt-5 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white">View reasoning</button>
          {world.ui.scenarioBInsightOpen && <div className="mt-5 rounded-2xl border border-violet-200 bg-white p-5" role="region" aria-label="Workshop reasoning">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {['Thursday Oct 8 · 16:00–17:00 · FREE','19:00 deadline','~90 min focused work remains','16:00–18:00 strong focus window','High workload',reasoning.mentalWellbeing === 'slightly-strained' ? 'Slightly strained mental state' : 'Steady mental state'].map((text) => <div key={text} className="rounded-xl bg-slate-50 p-3 text-sm font-medium text-text-primary">{text}</div>)}
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><strong>{workshop?.title}</strong> is optional, {reasoning.workshopValue} value, {reasoning.recordingAvailable ? 'with recording available later' : 'without a recording option'}.</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-emerald-700">Calendar availability: Yes</p><p className="mt-1 text-sm">The hour contains no overlapping event.</p></div><div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-xs font-bold uppercase text-red-700">Usable capacity: Low</p><p className="mt-1 text-sm">Deadline pressure and focus opportunity cost are high.</p></div></div>
            <p className="mt-4 text-lg font-semibold text-text-primary">{reasoning.recommendationText}</p>
            {workshop?.status === 'declined-live' ? <p className="mt-3 text-sm font-semibold text-emerald-700">Declined live session · Recording flagged for later</p> : <button type="button" onClick={() => dispatch({ type:'use-workshop-recording' })} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Use recording instead</button>}
          </div>}
        </article>
        <article className="card p-6"><p className="text-xs font-bold uppercase tracking-wide text-primary">Current opportunity</p><h2 className="mt-2 text-2xl text-text-primary">{mentoring?.title}</h2><p className="mt-2 text-sm text-text-secondary"><span className="capitalize">{mentoring?.priority}</span> priority · <span className="capitalize">{mentoring?.value.level}</span> alignment with startup and advisory direction</p><div className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">Status: <strong>{mentoring?.status}</strong></div><Link to="/ask-future-me" className="mt-4 inline-flex text-sm font-bold text-primary">Ask Future Me →</Link></article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card p-6"><h2 className="text-2xl text-text-primary">Upcoming Commitments & Deadlines</h2><div className="mt-4 space-y-3">{upcoming.map((event) => <div key={event.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-semibold text-text-primary">{event.title}</p><p className="text-xs text-text-secondary">{event.start.replace('T',' · ')}</p></div><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold capitalize text-text-secondary">{event.kind}</span></div>)}</div></article>
        <article className="card p-6"><h2 className="text-2xl text-text-primary">Personal Direction Snapshot</h2><div className="mt-4 space-y-3">{world.goals.slice(0,4).map((goal) => <div key={goal.id} className="rounded-xl border border-surface-border p-3"><p className="text-xs font-bold uppercase text-text-secondary">{goal.horizon}</p><p className="mt-1 text-sm font-semibold text-text-primary">{goal.title}</p></div>)}</div></article>
      </section>
    </main>
  );
}

export default DashboardPage;
