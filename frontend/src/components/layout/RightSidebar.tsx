/**
 * RightSidebar - Temporal Reality (Calendar Timeline)
 * 8am-8pm view with 4 visual layers
 */
function RightSidebar() {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm

  return (
    <div className="h-screen overflow-y-auto p-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-text-secondary">Today</h2>
        
        {/* Timeline */}
        <div className="space-y-1">
          {hours.map((hour) => (
            <div key={hour} className="flex items-start gap-3">
              <time className="font-mono text-xs text-text-secondary w-12 pt-1">
                {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
              </time>
              <div className="flex-1 border-l border-slate-200 pl-3 min-h-[60px] relative">
                {/* Time blocks will be rendered here */}
                {hour === 9 && (
                  <div className="timeline-anchor rounded px-2 py-1 text-xs font-medium mb-2">
                    Team Standup
                  </div>
                )}
                {hour === 10 && (
                  <div className="timeline-intention rounded px-2 py-1 text-xs font-medium mb-2">
                    Deep Work: Frontend
                  </div>
                )}
                {hour === 15 && (
                  <div className="timeline-ghost rounded px-2 py-1 text-xs font-medium mb-2 text-text-secondary">
                    Suggested: Review
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RightSidebar;
