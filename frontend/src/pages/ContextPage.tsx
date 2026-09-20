/**
 * ContextPage - What Future Me Understands
 * Display all context AI has about the user
 */
function ContextPage() {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">What Future Me Understands</h1>
        <p className="text-text-secondary">Your goals, roles, and current state</p>
      </header>

      {/* Current Context */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Right Now</h2>
        
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Energy Level</p>
              <p className="font-mono text-lg text-text-primary">Medium</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Cognitive Load</p>
              <p className="font-mono text-lg text-text-primary">Medium</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Stress Level</p>
              <p className="font-mono text-lg text-text-primary">5/10</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Mood</p>
              <p className="font-mono text-lg text-text-primary">Focused</p>
            </div>
          </div>
          <button className="text-sm text-accent-ai font-medium hover:underline">
            Update my current state
          </button>
        </div>
      </section>

      {/* Goals */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Active Goals</h2>
        
        <div className="space-y-3">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-text-primary mb-1">Launch MVP at Hackathon</h3>
                <p className="text-sm text-text-secondary">
                  Complete Future Me MVP within 5-day hackathon timeline
                </p>
              </div>
              <span className="px-2 py-1 bg-accent-warning bg-opacity-10 text-accent-warning text-xs font-medium rounded">
                CRITICAL
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div className="bg-accent-warning h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
              <span className="font-mono text-sm text-text-secondary">35%</span>
            </div>
            <p className="text-xs text-text-secondary mt-2">Deadline: 3 days</p>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-text-primary mb-1">Daily Exercise Routine</h3>
              </div>
              <span className="px-2 py-1 bg-accent-intention bg-opacity-10 text-accent-intention text-xs font-medium rounded">
                MEDIUM
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div className="bg-accent-rest h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <span className="font-mono text-sm text-text-secondary">60%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Your Roles</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <h3 className="font-medium text-text-primary mb-1">Software Engineer</h3>
            <p className="text-sm text-text-secondary">40h/week commitment</p>
          </div>
          <div className="card p-4">
            <h3 className="font-medium text-text-primary mb-1">Hackathon Participant</h3>
            <p className="text-sm text-text-secondary">50h/week commitment</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContextPage;
