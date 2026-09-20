/**
 * HomePage - Dashboard view
 * Overview of interventions, clarifications, and upcoming commitments
 */
function HomePage() {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">Good afternoon</h1>
        <p className="text-text-secondary">Here's what needs your attention</p>
      </header>

      {/* Interventions Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Needs Your Input</h2>
        
        <div className="intervention-suggestion space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-text-primary mb-1">Schedule Capacity Alert</h3>
              <p className="text-sm text-text-secondary mb-2">
                You have 8 hours of planned work but only 5 hours of available time today.
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-accent-ai font-medium">Why is this happening?</summary>
                <p className="mt-2 text-text-secondary">
                  Your fixed commitments leave limited capacity. Consider moving lower-priority tasks to tomorrow.
                </p>
              </details>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-accent-ai text-white rounded-lg text-sm font-medium hover:bg-opacity-90">
              Review schedule
            </button>
            <button className="px-4 py-2 text-text-secondary text-sm hover:bg-slate-100 rounded-lg">
              Dismiss for today
            </button>
          </div>
        </div>
      </section>

      {/* Clarifications Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Help Future Me Understand</h2>
        
        <div className="card p-6 space-y-3">
          <h3 className="font-medium text-text-primary">What is your preferred morning routine duration?</h3>
          <p className="text-sm text-text-secondary">
            This helps me schedule recovery buffers and avoid early meetings
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:border-accent-ai hover:bg-accent-ai hover:bg-opacity-5">
              30 minutes
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:border-accent-ai hover:bg-accent-ai hover:bg-opacity-5">
              1 hour
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:border-accent-ai hover:bg-accent-ai hover:bg-opacity-5">
              1.5 hours
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:border-accent-ai hover:bg-accent-ai hover:bg-opacity-5">
              2 hours
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-1">Available Today</p>
          <p className="text-2xl font-mono text-accent-intention">5h</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-1">Commitments</p>
          <p className="text-2xl font-mono text-accent-anchor">3</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-1">Energy Level</p>
          <p className="text-2xl font-mono text-text-primary">Medium</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
