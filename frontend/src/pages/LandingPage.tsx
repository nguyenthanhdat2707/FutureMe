import { Link } from 'react-router-dom';

const SAMPLE_EVENTS = [
  { time: '09:00', title: 'Product sync', tag: 'MOVABLE', color: { bg: '#EDE9FE', border: '#C4B5FD', text: '#6D28D9' } },
  { time: '10:00', title: 'Deep work', tag: 'FIXED', color: { bg: '#DBEAFE', border: '#93C5FD', text: '#1D4ED8' } },
  { time: '13:30', title: 'Client call', tag: 'FIXED', color: { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C' } },
];

export function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at 78% 24%, rgba(116, 82, 245, 0.14), transparent 34%), radial-gradient(circle at 24% 15%, rgba(255, 137, 61, 0.08), transparent 30%), linear-gradient(180deg, #fcfaf6 0%, #f7f5f2 100%)',
      }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="text-xl font-bold text-gray-800">Future Me</span>
        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50"
          >
            Demo
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500 mb-6">Capacity Intelligence</p>
          <h1 className="text-5xl font-bold leading-tight text-gray-900 lg:text-6xl">
            Your calendar can tell you
            <br />
            <span className="text-violet-600">when you&apos;re free.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            Future Me tells you
            <br />
            <strong>whether you should say yes.</strong>
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/dashboard"
              className="rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-violet-700"
            >
              Try the demo
            </Link>
            <a
              href="#how"
              className="rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Calendar preview card */}
        <div className="relative">
          <div
            className="rounded-3xl bg-white p-6 shadow-2xl"
            style={{ border: '1px solid rgba(40,50,70,0.08)' }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400 mb-4">Today</p>
            <div className="space-y-2">
              {SAMPLE_EVENTS.map((ev) => (
                <div
                  key={ev.title}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                  style={{ background: ev.color.bg, borderLeft: `3px solid ${ev.color.border}` }}
                >
                  <span className="text-xs font-mono text-gray-500 shrink-0">{ev.time}</span>
                  <span className="flex-1 text-sm font-semibold" style={{ color: ev.color.text }}>{ev.title}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: ev.color.border + '55', color: ev.color.text }}
                  >
                    {ev.tag}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-violet-50 p-4">
              <p className="text-sm text-violet-800 leading-relaxed">
                &ldquo;You have 2 free hours, but only 45 min of usable high-quality focus.&rdquo;
              </p>
            </div>
          </div>
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -right-4 -top-4 size-32 rounded-full bg-violet-200/30 blur-3xl" />
        </div>
      </section>

      {/* Problem section */}
      <section className="mx-auto max-w-4xl px-8 py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500 mb-4">The real problem</p>
        <h2 className="text-3xl font-bold text-gray-900">Free time is not the same as usable capacity.</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              icon: '📅',
              title: 'Empty calendar',
              body: 'Looks available. But meetings fragmented the morning. Focus is gone.',
            },
            {
              icon: '🗓️',
              title: 'Full calendar',
              body: 'Looks busy. But the afternoon block is recoverable. There is room.',
            },
            {
              icon: '⏱️',
              title: 'Enough hours',
              body: 'Time exists. But wrong-quality hours for the kind of work this requires.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl bg-white p-6 text-left"
              style={{ border: '1px solid rgba(40,50,70,0.08)' }}
            >
              <span className="text-3xl">{card.icon}</span>
              <h3 className="mt-3 font-bold text-gray-800">{card.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-4xl px-8 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500 mb-4 text-center">How Future Me reasons</p>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">From calendar to clarity</h2>
        <div className="flex flex-wrap justify-center gap-3 items-center">
          {(['Context', 'Trade-offs', 'Recommendation', 'Choice', 'Learning'] as const).map((step, i, arr) => (
            <div key={step} className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 px-5 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-400">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="mt-1 font-semibold text-violet-800">{step}</p>
              </div>
              {i < arr.length - 1 && <span className="text-gray-300 text-xl">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-xl px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Ready to see the difference?</h2>
        <p className="mt-4 text-gray-500">No signup required. Explore with demo data.</p>
        <Link
          to="/dashboard"
          className="mt-8 inline-block rounded-2xl bg-violet-600 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-violet-700"
        >
          Try Future Me
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        Future Me — Capacity Intelligence for thoughtful people.
      </footer>
    </div>
  );
}

export default LandingPage;
