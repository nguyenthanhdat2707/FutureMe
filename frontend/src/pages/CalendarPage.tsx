/**
 * CalendarPage - Full calendar view
 * Extended view of the timeline with all time blocks
 */
function CalendarPage() {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-text-primary mb-2">Calendar</h1>
        <p className="text-text-secondary">Your temporal reality for today</p>
      </header>

      {/* Legend */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 timeline-anchor rounded"></div>
          <span className="text-text-secondary">Fixed Commitments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 timeline-intention rounded"></div>
          <span className="text-text-secondary">Flexible Intentions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 timeline-ghost rounded"></div>
          <span className="text-text-secondary">AI Suggestions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 timeline-recovery rounded"></div>
          <span className="text-text-secondary">Recovery Buffers</span>
        </div>
      </div>

      {/* Full Timeline */}
      <div className="card p-6">
        <div className="space-y-1">
          {hours.map((hour) => (
            <div key={hour} className="flex items-start gap-4 border-b border-slate-100 last:border-0 py-3">
              <time className="font-mono text-sm text-text-secondary w-16 pt-1">
                {hour === 12 ? '12:00pm' : hour > 12 ? `${hour - 12}:00pm` : `${hour}:00am`}
              </time>
              <div className="flex-1 min-h-[80px]">
                {hour === 9 && (
                  <div className="timeline-anchor rounded-lg p-4">
                    <p className="font-medium text-white">Team Standup</p>
                    <p className="text-sm text-white text-opacity-90 mt-1">30 minutes • Fixed</p>
                  </div>
                )}
                {hour === 10 && (
                  <div className="timeline-intention rounded-lg p-4">
                    <p className="font-medium text-accent-intention">Deep Work: Frontend Implementation</p>
                    <p className="text-sm text-text-secondary mt-1">3 hours • Flexible</p>
                    <p className="text-xs text-text-secondary mt-2">🎯 Launch MVP at Hackathon</p>
                  </div>
                )}
                {hour === 13 && (
                  <div className="timeline-recovery rounded-lg p-4">
                    <p className="font-medium text-accent-rest">Lunch Break</p>
                    <p className="text-sm text-text-secondary mt-1">1 hour • Recovery</p>
                  </div>
                )}
                {hour === 15 && (
                  <div className="timeline-ghost rounded-lg p-4">
                    <p className="font-medium text-text-secondary">Suggested: Review & Testing</p>
                    <p className="text-sm text-text-secondary mt-1">2 hours • AI Proposal</p>
                    <button className="text-xs text-accent-ai font-medium mt-2 hover:underline">
                      Add to schedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capacity Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-2">Total Available</p>
          <p className="text-3xl font-mono text-text-primary">12h</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-2">Committed</p>
          <p className="text-3xl font-mono text-accent-anchor">7h</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-text-secondary mb-2">Remaining</p>
          <p className="text-3xl font-mono text-accent-intention">5h</p>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
