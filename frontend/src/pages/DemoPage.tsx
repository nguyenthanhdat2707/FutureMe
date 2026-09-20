/**
 * DemoPage - Demo Mode Controls
 * Load pre-configured scenarios for demonstration
 */
function DemoPage() {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">Demo Mode</h1>
        <p className="text-text-secondary">Explore Future Me with pre-loaded scenarios</p>
      </header>

      {/* Demo Scenarios */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif text-text-primary">Available Scenarios</h2>
        
        <div className="grid gap-4">
          <div className="card p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="font-medium text-text-primary mb-2">Overcommitted Developer</h3>
            <p className="text-sm text-text-secondary mb-4">
              A developer juggling too many commitments with an approaching deadline. 
              Demonstrates capacity alerts and schedule optimization.
            </p>
            <div className="flex gap-4 text-xs text-text-secondary">
              <span>Energy: Low</span>
              <span>Cognitive Load: High</span>
              <span>Stress: 7/10</span>
            </div>
            <button className="mt-4 px-4 py-2 bg-accent-ai text-white rounded-lg text-sm font-medium hover:bg-opacity-90">
              Load Scenario
            </button>
          </div>

          <div className="card p-6 hover:shadow-md transition-shadow cursor-pointer opacity-50">
            <h3 className="font-medium text-text-primary mb-2">Energy-Aware Scheduling</h3>
            <p className="text-sm text-text-secondary mb-4">
              Shows how Future Me matches task energy requirements with your daily energy patterns.
            </p>
            <div className="flex gap-4 text-xs text-text-secondary">
              <span>Coming soon</span>
            </div>
          </div>

          <div className="card p-6 hover:shadow-md transition-shadow cursor-pointer opacity-50">
            <h3 className="font-medium text-text-primary mb-2">Goal Drift Alert</h3>
            <p className="text-sm text-text-secondary mb-4">
              Demonstrates proactive intervention when daily actions drift from long-term goals.
            </p>
            <div className="flex gap-4 text-xs text-text-secondary">
              <span>Coming soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="card p-6 space-y-4">
        <h3 className="font-medium text-text-primary">Demo Controls</h3>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-slate-300 text-text-primary rounded-lg text-sm hover:bg-slate-50">
            Reset to Default
          </button>
          <button className="px-4 py-2 border border-slate-300 text-text-primary rounded-lg text-sm hover:bg-slate-50">
            Skip to Next Event
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-accent-ai bg-opacity-5 border border-accent-ai rounded-lg p-6">
        <h3 className="font-medium text-text-primary mb-2">How to use Demo Mode</h3>
        <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside">
          <li>Select a scenario above to load pre-configured goals, context, and calendar events</li>
          <li>Navigate through the app to see how Future Me responds to different situations</li>
          <li>All changes in demo mode are temporary and won't affect your actual data</li>
          <li>Use the controls to reset or advance through scenario events</li>
        </ul>
      </div>
    </div>
  );
}

export default DemoPage;
